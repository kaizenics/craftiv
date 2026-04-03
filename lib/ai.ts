import OpenAI from "openai";
import { TRPCError } from "@trpc/server";

// ── Client ──────────────────────────────────────────────────────────────────

export const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
  defaultHeaders: {
    "HTTP-Referer": process.env.BETTER_AUTH_URL || "http://localhost:3000",
    "X-Title": "Layro",
  },
});

export const AI_MODEL = "google/gemini-2.0-flash-001";
export const AI_MODEL_FALLBACK = "qwen/qwen3.6-plus-preview:free";

// ── Response helpers ────────────────────────────────────────────────────────

export function extractContent(choice: any): string | null {
  return (
    choice?.message?.content ??
    choice?.message?.reasoning_content ??
    choice?.message?.reasoning ??
    choice?.text ??
    (typeof choice?.message === "string" ? choice.message : null)
  );
}

export interface AiCallParams {
  messages: { role: string; content: string }[];
  maxTokens: number;
  temperature: number;
}

export async function callWithFallback(
  params: AiCallParams,
): Promise<{ content: string; model: string }> {
  const models = [AI_MODEL, AI_MODEL_FALLBACK];

  for (const model of models) {
    try {
      console.log(`[AI] Trying model: ${model}`);
      const start = Date.now();

      const response = await openrouter.chat.completions.create({
        model,
        messages: params.messages as any,
        max_tokens: params.maxTokens,
        temperature: params.temperature,
      });

      const elapsed = Date.now() - start;
      const finish = (response.choices[0] as any)?.finish_reason ?? "N/A";
      const tokens = response.usage?.total_tokens ?? "N/A";
      const content = extractContent(response.choices[0])?.trim();

      console.log(`[AI] ${model} — ${elapsed}ms, tokens: ${tokens}, finish: ${finish}`);

      if (content) {
        console.log(`[AI] Got content (${content.length} chars) from ${model}`);
        return { content, model };
      }

      console.warn(
        `[AI] Empty content from ${model}. Choice:`,
        JSON.stringify(response.choices[0], null, 2).slice(0, 500),
      );
    } catch (error: any) {
      console.error(`[AI] Error from ${model}:`, error.message ?? error);
    }
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "All AI models failed to respond. Please try again later.",
  });
}

// ── JSON extraction ─────────────────────────────────────────────────────────

export function extractJsonObject(raw: string): Record<string, any> | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export function extractJsonArray(raw: string): any[] | null {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// ── Prompt builders ─────────────────────────────────────────────────────────

export function buildImproveSectionPrompt(
  section: string,
  content: string,
  targetRole?: string,
): string {
  const roleHint = targetRole ? `The target job role is: ${targetRole}.` : "";
  return `You are a professional resume writer. ${roleHint}
Improve the following resume ${section} section to be more impactful, concise, and ATS-friendly.
Use strong action verbs and quantify achievements where possible.
Return ONLY the improved text. No explanation, no markdown formatting, no quotes.

Original:
${content}`;
}

export function buildImproveFullResumePrompt(
  data: Record<string, unknown>,
  targetRole?: string,
): string {
  const roleHint = targetRole ? `The target job role is: ${targetRole}.` : "";
  return `You are a professional resume writer. ${roleHint}
Review the following resume data and return an improved version.
Improve the summary to be compelling and ATS-friendly.
Improve each experience description with strong action verbs and quantified achievements.
Improve each education description if present.
Keep all other fields (names, dates, IDs, etc.) exactly the same.
Return ONLY valid JSON matching the exact same structure. No markdown, no explanation.

Resume data:
${JSON.stringify(data, null, 2)}`;
}

export function buildSpellCheckPrompt(fieldsText: string): string {
  return `You are a professional resume proofreader and content reviewer. Analyze the following resume text fields and find ALL issues.

Important exclusions:
- Do NOT report spelling or grammar issues for personal identifiers such as full name, first name, last name, email address, or phone number.
- Do NOT report spelling or grammar issues for employer or company names (including company name fields).

Check for these types of problems:
1. SPELLING: Misspelled words, typos, made-up words (e.g. "Rfacturing", "hillo", "heiy")
2. GRAMMAR: Grammatical errors, wrong tense, subject-verb disagreement
3. PLACEHOLDER: Lorem ipsum text, placeholder text, template text that was not replaced (e.g. "[job title]", "[X] years"), or any nonsensical filler content that does not belong in a real resume
4. CONTENT: Inappropriate or irrelevant content for a professional resume

For each issue, return a JSON object with:
- "type": one of "spelling", "grammar", "placeholder", or "content"
- "field": the field name exactly as given in brackets
- "original": the exact problematic word, phrase, or sentence
- "corrected": the suggested correction (for placeholder/content issues, write a brief professional replacement or "Remove this placeholder text and write actual content")
- "context": a short phrase showing where the issue appears

Return a JSON array of all issues found. If no issues, return [].
Return ONLY the JSON array. No markdown, no explanation, no code fences, no extra text.

Resume fields:
${fieldsText}`;
}

export function buildSuggestionPrompt(
  field: string,
  currentContent: string,
  jobTitle?: string,
): string {
  const jobContext = jobTitle ? `The person's job title is "${jobTitle}".` : "";

  let sectionHint: string;
  if (field.includes("Description") && field.includes("Experience")) {
    sectionHint =
      "This is a work experience description. Write 2-4 bullet points describing achievements and responsibilities using strong action verbs with quantified results.";
  } else if (field.includes("Description") && field.includes("Education")) {
    sectionHint =
      "This is an education description. Briefly mention relevant coursework, honors, or academic achievements.";
  } else if (field === "Summary") {
    sectionHint =
      "This is a professional summary. Write a compelling 2-3 sentence overview highlighting experience, key skills, and career goals.";
  } else {
    sectionHint = `This is the "${field}" field of a resume.`;
  }

  return `You are a professional resume writer. ${jobContext}
${sectionHint}

The current content is inappropriate or needs replacement:
"${currentContent}"

Write a professional replacement for this resume field.
Return ONLY the replacement text. No explanation, no markdown, no quotes, no bullet symbols.
Keep it concise and professional.`;
}

// ── Keyword Booster ─────────────────────────────────────────────────────────

export function buildKeywordBoosterPrompt(
  resumeText: string,
  jobDescription: string,
): string {
  return `You are an expert ATS keyword analyst. Compare the resume below against the job description and identify missing keywords the candidate should add.

For each missing keyword, return a JSON object with:
- "keyword": the exact keyword or phrase missing
- "importance": "high", "medium", or "low"
- "section": which resume section to place it in ("summary", "experience", "skills", or "education")
- "suggestion": a brief sentence showing how to naturally incorporate this keyword

Return a JSON array of objects. If no keywords are missing, return [].
Return ONLY the JSON array. No markdown, no explanation, no code fences.

--- RESUME ---
${resumeText}

--- JOB DESCRIPTION ---
${jobDescription}`;
}

// ── Achievement Builder ─────────────────────────────────────────────────────

export function buildAchievementBuilderPrompt(
  jobTitle: string,
  employer: string,
  description: string,
  targetRole?: string,
): string {
  const roleHint = targetRole ? `The candidate is targeting a role as: ${targetRole}.` : "";
  return `You are a professional resume writer specializing in accomplishment-based bullet points. ${roleHint}

The candidate worked as "${jobTitle}" at "${employer}". Their current description is:
"${description}"

Transform this into 3-5 powerful accomplishment bullet points. Each bullet should:
- Start with a strong action verb (e.g. Spearheaded, Delivered, Optimized, Architected)
- Include a quantified metric or a placeholder like [X%], [X+], [$Xk] where the candidate can fill in real numbers
- Show business impact, not just responsibility

Return ONLY the bullet points, one per line, each starting with "- ". No explanation, no markdown headers, no numbering.`;
}

// ── Cover Letter ────────────────────────────────────────────────────────────

export function buildCoverLetterPrompt(
  resumeText: string,
  jobDescription: string,
  companyName: string,
  tone: "professional" | "confident" | "enthusiastic",
): string {
  const toneGuide = {
    professional: "Maintain a polished, formal tone throughout.",
    confident: "Use a confident, direct tone that emphasizes proven expertise and leadership.",
    enthusiastic: "Write with genuine enthusiasm and passion for the role and company.",
  };

  return `You are a professional cover letter writer. Write a compelling cover letter based on the resume and job description below.

Guidelines:
- ${toneGuide[tone]}
- Address it to "Hiring Manager" at "${companyName || "the company"}"
- Open with a strong hook that connects the candidate to the role
- Highlight 2-3 relevant achievements from the resume that match the job requirements
- Close with a confident call to action
- Keep it to 3-4 paragraphs, under 350 words
- Do NOT include the date, address block, or "Sincerely" signature — just the letter body

Return ONLY the cover letter text. No markdown, no explanation, no quotes.

--- RESUME ---
${resumeText}

--- JOB DESCRIPTION ---
${jobDescription}`;
}

// ── Resume text extraction ──────────────────────────────────────────────────

export interface ResumeTextField {
  field: string;
  value: string;
}

export function extractResumeTextFields(data: any): ResumeTextField[] {
  const fields: ResumeTextField[] = [];

  if (data.summary) fields.push({ field: "Summary", value: data.summary });

  if (data.contact) {
    const c = data.contact;
    if (c.firstName) fields.push({ field: "First Name", value: c.firstName });
    if (c.lastName) fields.push({ field: "Last Name", value: c.lastName });
    if (c.desiredJobTitle) fields.push({ field: "Job Title", value: c.desiredJobTitle });
  }

  if (Array.isArray(data.experiences)) {
    data.experiences.forEach((exp: any, i: number) => {
      const n = i + 1;
      if (exp.jobTitle) fields.push({ field: `Experience ${n} - Job Title`, value: exp.jobTitle });
      if (exp.employer) fields.push({ field: `Experience ${n} - Employer`, value: exp.employer });
      if (exp.description) fields.push({ field: `Experience ${n} - Description`, value: exp.description });
    });
  }

  if (Array.isArray(data.educations)) {
    data.educations.forEach((edu: any, i: number) => {
      const n = i + 1;
      if (edu.schoolName) fields.push({ field: `Education ${n} - School`, value: edu.schoolName });
      if (edu.degree) fields.push({ field: `Education ${n} - Degree`, value: edu.degree });
      if (edu.description) fields.push({ field: `Education ${n} - Description`, value: edu.description });
    });
  }

  if (Array.isArray(data.skills)) {
    data.skills.forEach((skill: any, i: number) => {
      if (skill.name) fields.push({ field: `Skill ${i + 1}`, value: skill.name });
    });
  }

  return fields;
}

export function formatFieldsForPrompt(fields: ResumeTextField[]): string {
  return fields.map((f) => `[${f.field}]: ${f.value}`).join("\n");
}

// ── Cover Letter from Resume (no job description) ───────────────────────────

export function buildCoverLetterFromResumePrompt(resumeText: string): string {
  return `You are a professional cover letter writer. Based ONLY on the resume below, write a compelling, versatile cover letter that the candidate can use for relevant job applications.

Guidelines:
- Maintain a polished, professional tone throughout
- Include a natural greeting and closing as part of the letter
- Mention 2-3 standout achievements or skills from the resume with specific details
- Keep it under 300 words total
- Do NOT mention a specific company or job title — keep it general enough to adapt

Return ONLY a JSON object with exactly this key. No markdown, no code fences, no explanation:
{
  "content": "the full cover letter text with paragraph breaks"
}

--- RESUME ---
${resumeText}`;
}

// ── Cover Letter from editor context (job-title targeted) ───────────────────

export function buildCoverLetterFromEditorPrompt(input: {
  targetJobTitle: string;
  companyName?: string;
  hiringManagerName?: string;
  candidateContext: string;
  existingDraft?: string;
}): string {
  const company = input.companyName?.trim() || "the company";
  const hiring = input.hiringManagerName?.trim();

  return `You are a senior career writing assistant.

Write a high-quality, specific cover letter draft for the role "${input.targetJobTitle}" at "${company}".

Rules:
- Professional, human, and concise tone (no fluff, no cliches, no repetitive phrases).
- 170-260 words total.
- 3 to 4 short paragraphs.
- Include a greeting line. Use "${hiring ? `Dear ${hiring},` : "Dear Hiring Manager,"}".
- Mention the target job title naturally in the opening.
- Use concrete achievements from candidate context where available.
- End with a strong but natural closing line.
- Do NOT invent unrealistic claims or fake metrics.
- Return plain text only (no markdown, no bullets, no JSON).

Candidate context:
${input.candidateContext}

Existing draft (optional):
${input.existingDraft?.trim() || "(none)"}`;
}
