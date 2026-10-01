import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { resumes, type ResumeDataJSON } from "@/db/schema";
import { auth } from "@/lib/auth";
import { callWithFallback, extractJsonObject } from "@/lib/ai";
import { MAX_UPLOAD_BYTES } from "@/lib/constants/files";
import { extractTextFromFile, getUploadKind } from "@/lib/file-parsing";
import { analyzeResumeData, analyzeResumeText, formatResumeDataForAts, type AtsReport } from "@/lib/ats";
import {
  ATS_CHECK_COST,
  buildInsufficientCreditsPayload,
  InsufficientCreditsError,
  newChargeIdempotencyKey,
  refundCredits,
} from "@/lib/credits";
import { beginAiAction, describeAiCharge } from "@/lib/own-ai-access";
import { enforceApiRouteGuards } from "@/lib/security/guards";
import { assertContentLength } from "@/lib/security/request";
import { hashForLogs, securityLog } from "@/lib/security/logging";

function isLikelyResumeText(rawText: string) {
  const text = rawText.toLowerCase();

  const resumeSignals = [
    /\bexperience\b/,
    /\beducation\b/,
    /\bskills?\b/,
    /\bsummary\b/,
    /\bprofessional\b/,
    /\bwork history\b/,
    /\bemployment\b/,
    /\bcertifications?\b/,
    /\bprojects?\b/,
    /\breferences\b/,
    /\bresume\b/,
    /\bcurriculum vitae\b/,
  ];

  const coverLetterSignals = [
    /\bdear\s+[a-z]/,
    /\bsincerely\b/,
    /\bto whom it may concern\b/,
    /\bhiring manager\b/,
    /\bi am writing to\b/,
    /\bthank you for your consideration\b/,
    /\bcover letter\b/,
  ];

  const resumeHits = resumeSignals.filter((pattern) => pattern.test(text)).length;
  const coverLetterHits = coverLetterSignals.filter((pattern) => pattern.test(text)).length;
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(rawText);
  const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(rawText);
  const hasDateRange = /\b(19|20)\d{2}\s*[-–]\s*((19|20)\d{2}|present|current)\b/i.test(rawText);
  const hasBulletLikeLines = /(^|\n)\s*[-*•]\s+\S+/m.test(rawText);

  const resumeEvidence =
    resumeHits +
    (hasEmail ? 1 : 0) +
    (hasPhone ? 1 : 0) +
    (hasDateRange ? 1 : 0) +
    (hasBulletLikeLines ? 1 : 0);

  const isResume = resumeEvidence >= 3 && !(coverLetterHits >= 2 && resumeHits <= 1);

  return { isResume };
}

function buildAtsPrompt(text: string, baseline: AtsReport, jobDescription: string): string {
  return `You are an ATS resume coach and recruiter.
Use the ATS baseline as factual truth. Do NOT change or override baseline fields.

Baseline fields you must keep exactly:
- overallScore: ${baseline.overallScore}
- atsCompatibility: ${baseline.atsCompatibility}
- matchedKeywords: ${JSON.stringify(baseline.matchedKeywords)}
- missingKeywords: ${JSON.stringify(baseline.missingKeywords)}
- strengths: ${JSON.stringify(baseline.strengths)}
- topActions: ${JSON.stringify(baseline.topActions)}
- sectionScores: ${JSON.stringify(baseline.sectionScores)}
- placeholderWarnings: ${JSON.stringify(baseline.placeholderWarnings)}
- parseWarnings: ${JSON.stringify(baseline.parseWarnings)}
- scoringVersion: ${JSON.stringify(baseline.scoringVersion)}

Return ONLY valid JSON with this exact structure:
{
  "overallScore": 0,
  "atsCompatibility": "Low",
  "summary": "",
  "strengths": [""],
  "matchedKeywords": [""],
  "missingKeywords": [""],
  "topActions": [""],
  "rewrittenSummary": "",
  "sectionScores": [
    {
      "section": "",
      "score": 0,
      "notes": ""
    }
  ],
  "placeholderWarnings": [""],
  "parseWarnings": [""],
  "scoringVersion": "",
  "improvements": [
    {
      "title": "",
      "why": "",
      "example": ""
    }
  ]
}

Rules:
- Keep baseline fields unchanged.
- improvements: 5 to 8 concrete improvements with practical example text.
- rewrittenSummary: provide a stronger 3-5 sentence professional summary.
- If placeholderWarnings is non-empty, mention resolving placeholders in the recruiter summary or improvements.
- Return only JSON. No markdown. No explanation.

Target job description (optional):
${jobDescription || "N/A"}

Resume text:
${text}`;
}

async function getOwnedResume(resumeId: string, userId: string) {
  const resume = await db.query.resumes.findFirst({
    where: eq(resumes.id, resumeId),
  });

  if (!resume || resume.userId !== userId) {
    return null;
  }

  return resume;
}

export async function POST(request: NextRequest) {
  let chargedRequest: { userId: string; idempotencyKey: string } | null = null;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const guard = await enforceApiRouteGuards({
      request,
      route: "/api/ats-check",
      category: "ai_heavy",
      userId: session.user.id,
    });
    if (!guard.ok) {
      return guard.response;
    }

    assertContentLength(request, 11_000_000);
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const resumeId = (formData.get("resumeId") as string | null)?.trim() || "";
    const jobDescription = (formData.get("jobDescription") as string | null)?.trim() || "";
    const requestId = crypto.randomUUID();
    // Recorded for support correlation only. It used to seed the charge key,
    // which let a caller replay one value and never be charged again.
    const clientRequestId = (formData.get("requestId") as string | null)?.trim() || null;

    if (!file && !resumeId) {
      return NextResponse.json({ error: "Provide a file or resumeId for ATS analysis." }, { status: 400 });
    }

    let resumeText = "";
    let baseline: AtsReport;
    const metadata: Record<string, unknown> = { requestId, clientRequestId };

    if (resumeId) {
      const resume = await getOwnedResume(resumeId, session.user.id);
      if (!resume) {
        return NextResponse.json({ error: "Resume not found" }, { status: 404 });
      }

      const data = resume.data as ResumeDataJSON | null;
      if (!data) {
        return NextResponse.json({ error: "Resume has no content." }, { status: 400 });
      }

      resumeText = formatResumeDataForAts(data);
      baseline = analyzeResumeData(data, jobDescription);
      metadata.resumeId = resumeId;
      metadata.analysisSource = "saved_resume";
    } else {
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
      }

      const { isPDF, isSupported } = getUploadKind(file.name);

      if (!isSupported) {
        return NextResponse.json({ error: "Only PDF and DOCX files are supported" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        resumeText = await extractTextFromFile(buffer, isPDF);
      } catch {
        return NextResponse.json(
          { error: "Failed to read file content. The file may be corrupted or password-protected." },
          { status: 422 },
        );
      }

      if (!resumeText || resumeText.trim().length < 20) {
        return NextResponse.json(
          { error: "Could not extract enough text from the file." },
          { status: 422 },
        );
      }

      const relevanceCheck = isLikelyResumeText(resumeText);
      if (!relevanceCheck.isResume) {
        return NextResponse.json(
          {
            error:
              "This file does not appear to be a resume. Please upload a resume/CV document for ATS checking.",
          },
          { status: 422 },
        );
      }

      const parseWarnings: string[] = [];
      const truncatedText = resumeText.slice(0, 12000);
      if (resumeText.length > truncatedText.length) {
        parseWarnings.push("Analysis used the first 12000 characters of the uploaded file.");
      }

      baseline = analyzeResumeText({
        resumeText: truncatedText,
        jobDescription,
        parseWarnings,
      });
      resumeText = truncatedText;
      metadata.fileName = file.name;
      metadata.analysisSource = "uploaded_file";
    }

    const prompt = buildAtsPrompt(resumeText, baseline, jobDescription);
    const chargeIdempotencyKey = newChargeIdempotencyKey("ats_check", session.user.id);
    const { ai, charge: chargeResult } = await beginAiAction({
      userId: session.user.id,
      eventType: "ats_check",
      costUnits: ATS_CHECK_COST,
      idempotencyKey: chargeIdempotencyKey,
      metadata,
    });
    if (chargeResult) {
      chargedRequest = { userId: session.user.id, idempotencyKey: chargeIdempotencyKey };

      securityLog("credits_consumed", {
        requestId: guard.requestId,
        route: "/api/ats-check",
        userIdHash: hashForLogs(session.user.id),
        eventType: "ats_check",
        costUnits: ATS_CHECK_COST,
        replayed: chargeResult.replayed,
        balanceUnits: chargeResult.balanceUnits,
      });
    }

    const { content } = await callWithFallback({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 4500,
      temperature: 0.2,
    }, ai);

    const parsed = extractJsonObject(content);
    if (!parsed) {
      throw new Error("AI returned an invalid response. Please try again.");
    }

    const report = {
      ...parsed,
      overallScore: baseline.overallScore,
      atsCompatibility: baseline.atsCompatibility,
      sectionScores: baseline.sectionScores,
      matchedKeywords: baseline.matchedKeywords,
      missingKeywords: baseline.missingKeywords,
      strengths: baseline.strengths,
      topActions: baseline.topActions,
      placeholderWarnings: baseline.placeholderWarnings,
      parseWarnings: baseline.parseWarnings,
      scoringVersion: baseline.scoringVersion,
    };

    return NextResponse.json({
      report,
      creditCharge: describeAiCharge(chargeResult),
    });
  } catch (error: unknown) {
    if (chargedRequest) {
      await refundCredits({
        userId: chargedRequest.userId,
        eventType: "ats_check_refund",
        refundUnits: ATS_CHECK_COST,
        idempotencyKey: `refund:${chargedRequest.idempotencyKey}`,
        metadata: {
          reason: "ats_generation_failed",
        },
      });
    }
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(buildInsufficientCreditsPayload(error), { status: 402 });
    }
    console.error("[ATS Check] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
