import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { callWithFallback, extractJsonObject } from "@/lib/ai";
import {
  ATS_CHECK_COST,
  buildInsufficientCreditsPayload,
  consumeCredits,
  InsufficientCreditsError,
  refundCredits,
} from "@/lib/credits";
import { enforceApiRouteGuards } from "@/lib/security/guards";
import { assertContentLength } from "@/lib/security/request";
import { hashForLogs, securityLog } from "@/lib/security/logging";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ACTION_VERBS = [
  "built",
  "led",
  "designed",
  "implemented",
  "improved",
  "optimized",
  "developed",
  "created",
  "managed",
  "delivered",
  "launched",
  "automated",
  "reduced",
  "increased",
  "scaled",
];

const GENERIC_ATS_KEYWORDS = [
  "leadership",
  "communication",
  "collaboration",
  "problem solving",
  "project management",
  "stakeholder",
  "analysis",
  "results",
  "strategy",
  "ownership",
  "impact",
  "agile",
];

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "you",
  "your",
  "are",
  "our",
  "was",
  "were",
  "have",
  "has",
  "had",
  "will",
  "would",
  "should",
  "can",
  "could",
  "job",
  "role",
  "work",
  "years",
  "year",
  "experience",
  "required",
  "preferred",
  "using",
  "within",
  "across",
]);

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

  // Require some resume structure and avoid clear cover-letter patterns.
  const isResume = resumeEvidence >= 3 && !(coverLetterHits >= 2 && resumeHits <= 1);

  return { isResume, resumeEvidence, resumeHits, coverLetterHits };
}

type DeterministicReport = {
  overallScore: number;
  atsCompatibility: "Low" | "Medium" | "High";
  sectionScores: Array<{ section: string; score: number; notes: string }>;
  missingKeywords: string[];
  strengths: string[];
  topActions: string[];
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function hasSection(text: string, sectionName: string) {
  const rgx = new RegExp(`\\b${sectionName}\\b`, "i");
  return rgx.test(text);
}

function extractJobKeywords(jobDescription: string): string[] {
  const tokens = (jobDescription.toLowerCase().match(/[a-z][a-z0-9+#.\-]{2,}/g) || [])
    .filter((t) => !STOPWORDS.has(t));

  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

function scoreResumeDeterministically(resumeText: string, jobDescription: string): DeterministicReport {
  const text = normalize(resumeText);
  const words = text.split(" ").filter(Boolean);
  const hasBullets = /(^|\n)\s*[-*•]/m.test(resumeText);
  const hasMetrics = /\b\d+%|\$\d+|\b\d+\+?\b/.test(resumeText);
  const actionVerbCount = ACTION_VERBS.filter((verb) => text.includes(verb)).length;

  const summaryScore = clampScore(
    (hasSection(resumeText, "summary") || hasSection(resumeText, "profile") ? 45 : 20) +
      (words.length > 180 ? 20 : 10) +
      (words.length < 1500 ? 20 : 10) +
      (actionVerbCount >= 3 ? 15 : 8)
  );

  const experienceScore = clampScore(
    (hasSection(resumeText, "experience") ? 35 : 10) +
      (hasBullets ? 20 : 8) +
      (hasMetrics ? 25 : 10) +
      Math.min(actionVerbCount * 4, 20)
  );

  const skillsScore = clampScore(
    (hasSection(resumeText, "skills") ? 45 : 10) +
      (/(react|node|typescript|python|java|sql|aws|docker|kubernetes|next.js|tailwind)/i.test(resumeText)
        ? 30
        : 12) +
      (text.includes("advanced") || text.includes("intermediate") || text.includes("expert") ? 20 : 10)
  );

  const educationScore = clampScore(
    (hasSection(resumeText, "education") ? 55 : 20) +
      (/(bachelor|master|university|college|degree)/i.test(resumeText) ? 30 : 12) +
      (/\b20\d{2}\b/.test(resumeText) ? 15 : 8)
  );

  const formattingScore = clampScore(
    (hasBullets ? 25 : 10) +
      (words.length >= 250 && words.length <= 1500 ? 30 : 15) +
      (hasSection(resumeText, "contact") || /@/.test(resumeText) ? 20 : 8) +
      (hasSection(resumeText, "experience") && hasSection(resumeText, "skills") && hasSection(resumeText, "education")
        ? 25
        : 12)
  );

  const jdKeywords = jobDescription.trim() ? extractJobKeywords(jobDescription) : [];
  const keywordPool = jdKeywords.length > 0 ? jdKeywords : GENERIC_ATS_KEYWORDS;
  const matched = keywordPool.filter((kw) => text.includes(kw.toLowerCase()));
  const missing = keywordPool.filter((kw) => !text.includes(kw.toLowerCase()));
  const keywordMatchRatio = keywordPool.length > 0 ? matched.length / keywordPool.length : 0;
  const keywordScore = clampScore(20 + keywordMatchRatio * 80);

  const overallScore = clampScore(
    summaryScore * 0.15 +
      experienceScore * 0.25 +
      skillsScore * 0.15 +
      educationScore * 0.1 +
      formattingScore * 0.2 +
      keywordScore * 0.15
  );

  const compatibility: "Low" | "Medium" | "High" =
    overallScore >= 80 ? "High" : overallScore >= 60 ? "Medium" : "Low";

  const sectionScores = [
    {
      section: "Summary",
      score: summaryScore,
      notes: summaryScore >= 75 ? "Clear and focused." : "Add a sharper value-focused summary.",
    },
    {
      section: "Experience",
      score: experienceScore,
      notes:
        experienceScore >= 75
          ? "Experience shows measurable impact."
          : "Use stronger action verbs and quantified outcomes.",
    },
    {
      section: "Skills",
      score: skillsScore,
      notes: skillsScore >= 75 ? "Skill section is relevant." : "Expand role-relevant hard skills and tools.",
    },
    {
      section: "Education",
      score: educationScore,
      notes: educationScore >= 75 ? "Education is clearly presented." : "Clarify degree/school/date details.",
    },
    {
      section: "Formatting",
      score: formattingScore,
      notes: formattingScore >= 75 ? "Structure is ATS-friendly." : "Improve structure and section consistency.",
    },
    {
      section: "Keyword Match",
      score: keywordScore,
      notes:
        keywordScore >= 75
          ? "Good keyword alignment with target role."
          : "Add missing target-role keywords naturally.",
    },
  ];

  const strengths: string[] = [];
  if (hasBullets) strengths.push("Uses bullet-based structure for readability.");
  if (hasMetrics) strengths.push("Includes measurable impact indicators.");
  if (actionVerbCount >= 4) strengths.push("Uses strong action-oriented language.");
  if (hasSection(resumeText, "skills")) strengths.push("Contains a dedicated skills section.");
  if (hasSection(resumeText, "education")) strengths.push("Education section is present and scannable.");

  while (strengths.length < 3) {
    strengths.push("Resume has a workable base to optimize further.");
  }

  const weakestSections = [...sectionScores].sort((a, b) => a.score - b.score).slice(0, 3);
  const actionMap: Record<string, string> = {
    Summary: "Rewrite the summary with role-specific value and 2-3 strongest strengths.",
    Experience: "Rewrite experience bullets with action + metric + outcome format.",
    Skills: "Add missing tools and technical keywords from your target role.",
    Education: "Clarify degree, institution, and graduation timeline.",
    Formatting: "Use clean headings and concise bullets for ATS parsing.",
    "Keyword Match": "Add important target-job keywords naturally across summary and experience.",
  };

  const topActions = weakestSections.map((s) => actionMap[s.section] || "Strengthen this section for ATS clarity.");

  return {
    overallScore,
    atsCompatibility: compatibility,
    sectionScores,
    missingKeywords: missing.slice(0, 15),
    strengths: strengths.slice(0, 6),
    topActions,
  };
}

async function extractTextFromFile(buffer: Buffer, isPDF: boolean): Promise<string> {
  if (isPDF) {
    const pdfParse = require("pdf-parse/lib/pdf-parse.js");
    const result = await pdfParse(buffer);
    return result.text;
  }

  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function buildAtsPrompt(text: string, deterministic: DeterministicReport, jobDescription: string): string {
  return `You are an ATS resume coach and recruiter.
Use the deterministic analysis as factual baseline. Do NOT change or override baseline fields.

Baseline fields you must keep exactly:
- overallScore: ${deterministic.overallScore}
- atsCompatibility: ${deterministic.atsCompatibility}
- missingKeywords: ${JSON.stringify(deterministic.missingKeywords)}
- strengths: ${JSON.stringify(deterministic.strengths)}
- topActions: ${JSON.stringify(deterministic.topActions)}
- sectionScores: ${JSON.stringify(deterministic.sectionScores)}

Return ONLY valid JSON with this exact structure:
{
  "overallScore": 0,
  "atsCompatibility": "Low",
  "summary": "",
  "strengths": [""],
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
- improvements: 5 to 8 concrete improvements with practical example text
- rewrittenSummary: provide a stronger 3-5 sentence professional summary
- Return only JSON. No markdown. No explanation.

Target job description (optional):
${jobDescription || "N/A"}

Resume text:
${text}`;
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
    const jobDescription = (formData.get("jobDescription") as string | null)?.trim() || "";
    const requestId = (formData.get("requestId") as string | null)?.trim() || crypto.randomUUID();

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const isPDF = fileName.endsWith(".pdf");
    const isDOCX = fileName.endsWith(".docx");

    if (!isPDF && !isDOCX) {
      return NextResponse.json({ error: "Only PDF and DOCX files are supported" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";
    try {
      extractedText = await extractTextFromFile(buffer, isPDF);
    } catch {
      return NextResponse.json(
        { error: "Failed to read file content. The file may be corrupted or password-protected." },
        { status: 422 }
      );
    }

    if (!extractedText || extractedText.trim().length < 20) {
      return NextResponse.json(
        { error: "Could not extract enough text from the file." },
        { status: 422 }
      );
    }

    const relevanceCheck = isLikelyResumeText(extractedText);
    if (!relevanceCheck.isResume) {
      return NextResponse.json(
        {
          error:
            "This file does not appear to be a resume. Please upload a resume/CV document for ATS checking.",
        },
        { status: 422 },
      );
    }

    const truncatedText = extractedText.slice(0, 12000);
    const deterministic = scoreResumeDeterministically(truncatedText, jobDescription);
    const prompt = buildAtsPrompt(truncatedText, deterministic, jobDescription);

    const chargeIdempotencyKey = `ats_check:${session.user.id}:${requestId}`;
    const chargeResult = await consumeCredits({
      userId: session.user.id,
      eventType: "ats_check",
      costUnits: ATS_CHECK_COST,
      idempotencyKey: chargeIdempotencyKey,
      metadata: {
        requestId,
        fileName: file.name,
      },
    });
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

    const { content } = await callWithFallback({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 4500,
      temperature: 0.2,
    });

    const parsed = extractJsonObject(content);
    if (!parsed) {
      throw new Error("AI returned an invalid response. Please try again.");
    }

    const report = {
      ...parsed,
      overallScore: deterministic.overallScore,
      atsCompatibility: deterministic.atsCompatibility,
      sectionScores: deterministic.sectionScores,
      missingKeywords: deterministic.missingKeywords,
      strengths: deterministic.strengths,
      topActions: deterministic.topActions,
    };

    return NextResponse.json({
      report,
      creditCharge: {
        chargedCredits: 1,
        balanceCredits: chargeResult.balanceUnits / 100,
        balanceUnits: chargeResult.balanceUnits,
        replayed: chargeResult.replayed,
      },
    });
  } catch (error: any) {
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
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
