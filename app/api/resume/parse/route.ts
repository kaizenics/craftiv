import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { callWithFallback, extractJsonObject } from "@/lib/ai";
import { MAX_UPLOAD_BYTES } from "@/lib/constants/files";
import { extractTextFromFile, getUploadKind } from "@/lib/file-parsing";
import {
  buildInsufficientCreditsPayload,
  consumeCredits,
  InsufficientCreditsError,
  RESUME_PARSE_COST,
  refundCredits,
} from "@/lib/credits";
import { enforceApiRouteGuards } from "@/lib/security/guards";
import { assertContentLength } from "@/lib/security/request";
import { hashForLogs, securityLog } from "@/lib/security/logging";

const VALID_SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const VALID_PROFICIENCIES = ["Basic", "Conversational", "Fluent", "Native"];

const generateId = () => Math.random().toString(36).substring(2, 9);

/** Loose shape of the resume JSON returned by the AI (every field is best-effort). */
interface RawParsedResume {
  contact?: {
    firstName?: string;
    lastName?: string;
    desiredJobTitle?: string;
    phone?: string;
    email?: string;
  };
  summary?: string;
  experiences?: Array<{
    jobTitle?: string;
    employer?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    isCurrentJob?: boolean;
    description?: string;
  }>;
  educations?: Array<{
    schoolName?: string;
    location?: string;
    degree?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  skills?: Array<{ name?: string; level?: string }>;
  languages?: Array<{ name?: string; proficiency?: string }>;
  certifications?: Array<{ name?: string; issuer?: string; date?: string }>;
  awards?: Array<{ title?: string; issuer?: string; date?: string }>;
  websites?: Array<{ label?: string; url?: string }>;
  references?: Array<{ name?: string; position?: string; company?: string; email?: string; phone?: string }>;
  hobbies?: Array<{ name?: string } | string>;
  customSections?: Array<{ sectionName?: string; description?: string }>;
}

function mapWithId<T>(items: T[] | undefined, mapper: (item: T) => Record<string, unknown>) {
  return (items || []).map((item) => ({ id: generateId(), ...mapper(item) }));
}

function buildResumeParsePrompt(text: string): string {
  return `You are an expert resume parser. Analyze the following resume text and extract structured information from it.

Return a JSON object with this EXACT structure (no extra keys, no markdown, no explanation):
{
  "contact": {
    "firstName": "",
    "lastName": "",
    "desiredJobTitle": "(their most recent or primary job title)",
    "phone": "",
    "email": ""
  },
  "experiences": [
    {
      "jobTitle": "",
      "employer": "",
      "location": "",
      "startDate": "(format: YYYY-MM or just the year)",
      "endDate": "(format: YYYY-MM, or 'Present' if current)",
      "isCurrentJob": false,
      "description": "(the full description/bullet points for this role, preserve line breaks)"
    }
  ],
  "educations": [
    {
      "schoolName": "",
      "location": "",
      "degree": "",
      "startDate": "",
      "endDate": "",
      "description": ""
    }
  ],
  "skills": [
    {
      "name": "",
      "level": "Intermediate"
    }
  ],
  "summary": "(professional summary/objective if present, otherwise generate a brief one from the resume content)",
  "languages": [
    {
      "name": "",
      "proficiency": "Fluent"
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": ""
    }
  ],
  "awards": [
    {
      "title": "",
      "issuer": "",
      "date": ""
    }
  ],
  "websites": [
    {
      "label": "(e.g. LinkedIn, Portfolio, GitHub)",
      "url": ""
    }
  ],
  "references": [
    {
      "name": "",
      "position": "",
      "company": "",
      "email": "",
      "phone": ""
    }
  ],
  "hobbies": [
    {
      "name": ""
    }
  ],
  "customSections": [
    {
      "sectionName": "(the heading/title of the section)",
      "description": "(the content under that section)"
    }
  ]
}

Rules:
- Extract ALL experiences, educations, skills, awards, references, hobbies, and any other sections found
- For skills level use one of: "Beginner", "Intermediate", "Advanced", "Expert"
- For language proficiency use one of: "Basic", "Conversational", "Fluent", "Native"
- Awards/honors section: extract title, issuer/organization, and date
- References section: extract name, position/title, company, email, and phone
- Hobbies/interests section: extract each hobby or interest as a separate item
- Custom sections: any resume section that does NOT fit into the above categories (e.g. "Volunteer Work", "Projects", "Publications", "Organizations") should go into customSections with the section heading as sectionName and the content as description
- If a field is not found, use empty string for strings, empty arrays for arrays
- Preserve original descriptions as closely as possible
- Return ONLY valid JSON. No markdown, no explanation, no code fences.

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
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const guard = await enforceApiRouteGuards({
      request,
      route: "/api/resume/parse",
      category: "ai_heavy",
      userId: session.user.id,
    });
    if (!guard.ok) {
      return guard.response;
    }

    assertContentLength(request, 11_000_000);
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    const { isPDF, isSupported } = getUploadKind(file.name);

    if (!isSupported) {
      return NextResponse.json(
        { error: "Only PDF and DOCX files are supported" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText: string;
    try {
      extractedText = await extractTextFromFile(buffer, isPDF);
    } catch (parseError) {
      console.error("[Resume Parse] File extraction error:", parseError);
      return NextResponse.json(
        { error: "Failed to read file content. The file may be corrupted or password-protected." },
        { status: 422 }
      );
    }

    if (!extractedText || extractedText.trim().length < 20) {
      return NextResponse.json(
        { error: "Could not extract meaningful text from the file. It may be image-based or empty." },
        { status: 422 }
      );
    }

    const truncatedText = extractedText.slice(0, 8000);
    const prompt = buildResumeParsePrompt(truncatedText);
    const requestId = crypto.randomUUID();
    const chargeIdempotencyKey = `resume_parse:${session.user.id}:${requestId}`;
    const chargeResult = await consumeCredits({
      userId: session.user.id,
      eventType: "resume_parse",
      costUnits: RESUME_PARSE_COST,
      idempotencyKey: chargeIdempotencyKey,
      metadata: {
        requestId,
        fileName: file.name,
      },
    });
    chargedRequest = { userId: session.user.id, idempotencyKey: chargeIdempotencyKey };

    securityLog("credits_consumed", {
      requestId: guard.requestId,
      route: "/api/resume/parse",
      userIdHash: hashForLogs(session.user.id),
      eventType: "resume_parse",
      costUnits: RESUME_PARSE_COST,
      replayed: chargeResult.replayed,
      balanceUnits: chargeResult.balanceUnits,
    });

    console.log(`[Resume Parse] Extracted ${extractedText.length} chars, sending ${truncatedText.length} to AI`);

    const { content, model } = await callWithFallback({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 4000,
      temperature: 0.2,
    });

    console.log(`[Resume Parse] AI response from ${model} (${content.length} chars)`);

    const parsed = extractJsonObject<RawParsedResume>(content);

    if (!parsed) {
      console.error("[Resume Parse] AI returned invalid JSON:", content.slice(0, 500));
      throw new Error("Failed to parse resume content. Please try again.");
    }

    const resumeData = {
      contact: {
        firstName: parsed.contact?.firstName || "",
        lastName: parsed.contact?.lastName || "",
        desiredJobTitle: parsed.contact?.desiredJobTitle || "",
        phone: parsed.contact?.phone || "",
        email: parsed.contact?.email || "",
      },
      experiences: mapWithId(parsed.experiences, (exp) => ({
        jobTitle: exp.jobTitle || "",
        employer: exp.employer || "",
        location: exp.location || "",
        startDate: exp.startDate || "",
        endDate: exp.endDate || "",
        isCurrentJob: exp.isCurrentJob || false,
        description: exp.description || "",
      })),
      educations: mapWithId(parsed.educations, (edu) => ({
        schoolName: edu.schoolName || "",
        location: edu.location || "",
        degree: edu.degree || "",
        startDate: edu.startDate || "",
        endDate: edu.endDate || "",
        description: edu.description || "",
      })),
      skills: mapWithId(parsed.skills, (skill) => ({
        name: skill.name || "",
        level: skill.level && VALID_SKILL_LEVELS.includes(skill.level) ? skill.level : "Intermediate",
        showLevel: true,
      })),
      summary: parsed.summary || "",
      finalize: {
        languages: mapWithId(parsed.languages, (lang) => ({
          name: lang.name || "",
          proficiency: lang.proficiency && VALID_PROFICIENCIES.includes(lang.proficiency) ? lang.proficiency : "Fluent",
        })),
        certifications: mapWithId(parsed.certifications, (cert) => ({
          name: cert.name || "",
          issuer: cert.issuer || "",
          date: cert.date || "",
        })),
        awards: mapWithId(parsed.awards, (award) => ({
          title: award.title || "",
          issuer: award.issuer || "",
          date: award.date || "",
        })),
        websites: mapWithId(parsed.websites, (site) => ({
          label: site.label || "",
          url: site.url || "",
        })),
        references: mapWithId(parsed.references, (ref) => ({
          name: ref.name || "",
          position: ref.position || "",
          company: ref.company || "",
          email: ref.email || "",
          phone: ref.phone || "",
        })),
        hobbies: mapWithId(parsed.hobbies, (hobby) => ({
          name: typeof hobby === "string" ? hobby : hobby.name || "",
        })),
        customSections: mapWithId(parsed.customSections, (section) => ({
          sectionName: section.sectionName || "",
          description: section.description || "",
        })),
      },
    };

    return NextResponse.json({
      data: resumeData,
      creditCharge: {
        replayed: chargeResult.replayed,
        chargedCredits: RESUME_PARSE_COST / 100,
        balanceCredits: chargeResult.balanceUnits / 100,
        balanceUnits: chargeResult.balanceUnits,
      },
    });
  } catch (error) {
    if (chargedRequest) {
      await refundCredits({
        userId: chargedRequest.userId,
        eventType: "resume_parse_refund",
        refundUnits: RESUME_PARSE_COST,
        idempotencyKey: `refund:${chargedRequest.idempotencyKey}`,
        metadata: {
          reason: "resume_parse_failed",
        },
      });
    }
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(buildInsufficientCreditsPayload(error), { status: 402 });
    }
    console.error("[Resume Parse] Error:", error);
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : "") || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
