import OpenAI from "openai";
import { TRPCError } from "@trpc/server";

import type { ResumeDataJSON } from "@/db/schema";


export const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
  defaultHeaders: {
    "HTTP-Referer": process.env.BETTER_AUTH_URL || "http://localhost:3000",
    "X-Title": "Craftiv",
  },
});

export const AI_MODEL = "google/gemini-2.5-flash";
export const AI_MODEL_FALLBACK = "moonshotai/kimi-k2.5";


export function extractContent(choice: unknown): string | null {
  const c = choice as
    | {
        message?: { content?: string; reasoning_content?: string; reasoning?: string } | string;
        text?: string;
      }
    | null
    | undefined;
  const message = c?.message;
  const msgObject = message && typeof message === "object" ? message : undefined;
  return (
    msgObject?.content ??
    msgObject?.reasoning_content ??
    msgObject?.reasoning ??
    c?.text ??
    (typeof message === "string" ? message : null)
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
        messages: params.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        max_tokens: params.maxTokens,
        temperature: params.temperature,
      });

      const elapsed = Date.now() - start;
      const finish = response.choices[0]?.finish_reason ?? "N/A";
      const tokens = response.usage?.total_tokens ?? "N/A";
      const content = extractContent(response.choices[0])?.trim();

      console.log(`[AI] ${model} - ${elapsed}ms, tokens: ${tokens}, finish: ${finish}`);

      if (content) {
        console.log(`[AI] Got content (${content.length} chars) from ${model}`);
        return { content, model };
      }

      console.warn(
        `[AI] Empty content from ${model}. Choice:`,
        JSON.stringify(response.choices[0], null, 2).slice(0, 500),
      );
    } catch (error) {
      console.error(`[AI] Error from ${model}:`, error instanceof Error ? error.message : error);
    }
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "All AI models failed to respond. Please try again later.",
  });
}


export function extractJsonObject<T = Record<string, unknown>>(raw: string): T | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

export function extractJsonArray<T = unknown>(raw: string): T[] | null {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}


export function buildImproveSectionPrompt(
  section: string,
  content: string,
  targetRole?: string,
  jobDescription?: string,
): string {
  const roleHint = targetRole ? `The target job role is: ${targetRole}.` : "";
  const jobHint = jobDescription?.trim()
    ? `Target job description:\n${jobDescription.trim().slice(0, 2000)}`
    : "";
  const experienceFormattingRule =
    section === "experience"
      ? `Formatting requirement for experience:
- The input may contain the separator token <<<EXP_SPLIT>>> between experience entries.
- Preserve <<<EXP_SPLIT>>> exactly between entries in your output.
- For each entry, output exactly 3 bullet points.
- Each bullet must start with "• " and be 12-28 words.
- Do not add headings, numbering, or extra commentary.`
      : "";

  return `You are a senior resume strategist and ATS optimization expert. ${roleHint}
${jobHint}
Rewrite ONLY the "${section}" section below so it is specific, concise, and ATS-friendly.

Hard requirements:
- Preserve factual truth from the original content. Do not invent companies, titles, tools, projects, dates, or metrics.
- Keep first-person pronouns out.
- Remove filler phrases, buzzwords, and repeated ideas.
- Use direct action-result language.
- Use only metrics that are already present in the source content.
- If no metric is available, keep the line qualitative and specific instead of adding placeholders.
- Keep tense consistent (present for current role, past for previous roles).
- Keep output ready to paste into a resume.

Section-specific rules:
- summary: 2-4 lines, role-relevant, includes core strengths and measurable impact.
- experience: polished bullet content with measurable outcomes and business impact, not task lists.
- education: concise and relevant; highlight distinctions, coursework, or outcomes only when useful.
${experienceFormattingRule}

Return ONLY the improved text. No explanation, no markdown, no quotes.

Original:
${content}`;
}

export function buildImproveFullResumePrompt(
  data: unknown,
  targetRole?: string,
  jobDescription?: string,
): string {
  const roleHint = targetRole ? `The target job role is: ${targetRole}.` : "";
  const jobHint = jobDescription?.trim()
    ? `Target job description:\n${jobDescription.trim().slice(0, 2000)}`
    : "";
  return `You are a senior resume strategist and ATS optimization expert. ${roleHint}
${jobHint}
Rewrite this resume data for higher interview conversion and ATS match.

Hard requirements:
- Keep structure and IDs exactly the same.
- Do not add or remove objects/keys.
- Do not change names, emails, phone numbers, employers, schools, dates, locations, or existing tools/technologies unless correcting obvious grammar/formatting.
- Improve only narrative fields (summary, experience.description, education.description, and short text fields where needed).
- Remove fluff and vague claims.
- Prioritize measurable outcomes only when they are already supported by the source content.
- If no metric exists, improve clarity and specificity without inventing placeholders.
- Keep writing concise, professional, and role-relevant.
- No first-person pronouns.

Return ONLY valid JSON matching the exact same structure. No markdown, no explanation, no code fences.

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


export function buildKeywordSuggestionPrompt(
  resumeText: string,
  jobDescription: string,
  missingKeywords: string[],
): string {
  return `You are an expert ATS resume writer.
The ATS analyzer has already determined the exact missing keywords below.
Do not add, remove, or rename keywords.

Rules:
- Use every keyword exactly once.
- Keep each suggestion natural and resume-ready.
- Do not suggest placeholder metrics or bracketed placeholders.
- Use "high", "medium", or "low" for importance.
- Use only these sections: "summary", "experience", "skills", or "education".

For each result, return a JSON object with:
- "keyword": the exact keyword provided below
- "importance": "high", "medium", or "low" based on job relevance
- "section": which resume section to place it in ("summary", "experience", "skills", or "education")
- "suggestion": one concise, natural resume-ready sentence showing how to incorporate the keyword without keyword stuffing or invented metrics

Return a JSON array of objects in the same order as the keyword list below.
Return ONLY the JSON array. No markdown, no explanation, no code fences.

--- MISSING KEYWORDS ---
${JSON.stringify(missingKeywords)}

--- RESUME ---
${resumeText}

--- JOB DESCRIPTION ---
${jobDescription}`;
}


export function buildAchievementBuilderPrompt(
  jobTitle: string,
  employer: string,
  description: string,
  targetRole?: string,
): string {
  const roleHint = targetRole ? `The candidate is targeting a role as: ${targetRole}.` : "";
  return `You are a senior resume writer specializing in accomplishment-based bullets. ${roleHint}

The candidate worked as "${jobTitle}" at "${employer}". Their current description is:
"${description}"

Transform this into exactly 4 high-impact accomplishment bullets.

Requirements for each bullet:
- Starts with a strong action verb.
- Includes an outcome when supported by the source.
- Use only metrics already present in the source description.
- If no metric is available, keep the bullet specific and qualitative without brackets or placeholders.
- Focuses on impact, scale, or efficiency, not routine duties.
- Uses concrete tools/processes only if present in the source.
- Max 28 words per bullet.
- No first-person pronouns.
- No fabricated claims.

Return ONLY the bullet points, one per line, each starting with "• ". No explanation, no markdown headers, no numbering.`;
}


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
- Do NOT include the date, address block, or "Sincerely" signature - just the letter body

Return ONLY the cover letter text. No markdown, no explanation, no quotes.

--- RESUME ---
${resumeText}

--- JOB DESCRIPTION ---
${jobDescription}`;
}


export interface ResumeTextField {
  field: string;
  value: string;
}

export function extractResumeTextFields(data: ResumeDataJSON): ResumeTextField[] {
  const fields: ResumeTextField[] = [];

  if (data.summary) fields.push({ field: "Summary", value: data.summary });

  if (data.contact) {
    const c = data.contact;
    if (c.firstName) fields.push({ field: "First Name", value: c.firstName });
    if (c.lastName) fields.push({ field: "Last Name", value: c.lastName });
    if (c.desiredJobTitle) fields.push({ field: "Job Title", value: c.desiredJobTitle });
  }

  if (Array.isArray(data.experiences)) {
    data.experiences.forEach((exp, i) => {
      const n = i + 1;
      if (exp.jobTitle) fields.push({ field: `Experience ${n} - Job Title`, value: exp.jobTitle });
      if (exp.employer) fields.push({ field: `Experience ${n} - Employer`, value: exp.employer });
      if (exp.description) fields.push({ field: `Experience ${n} - Description`, value: exp.description });
    });
  }

  if (Array.isArray(data.educations)) {
    data.educations.forEach((edu, i) => {
      const n = i + 1;
      if (edu.schoolName) fields.push({ field: `Education ${n} - School`, value: edu.schoolName });
      if (edu.degree) fields.push({ field: `Education ${n} - Degree`, value: edu.degree });
      if (edu.description) fields.push({ field: `Education ${n} - Description`, value: edu.description });
    });
  }

  if (Array.isArray(data.skills)) {
    data.skills.forEach((skill, i) => {
      if (skill.name) fields.push({ field: `Skill ${i + 1}`, value: skill.name });
    });
  }

  return fields;
}

export function formatFieldsForPrompt(fields: ResumeTextField[]): string {
  return fields.map((f) => `[${f.field}]: ${f.value}`).join("\n");
}


export function buildCoverLetterFromResumePrompt(resumeText: string): string {
  return `You are a professional cover letter writer. Based ONLY on the resume below, write a compelling, versatile cover letter that the candidate can use for relevant job applications.

Guidelines:
- Maintain a polished, professional tone throughout
- Include a natural greeting and closing as part of the letter
- Mention 2-3 standout achievements or skills from the resume with specific details
- Keep it under 300 words total
- Do NOT mention a specific company or job title - keep it general enough to adapt

Return ONLY a JSON object with exactly this key. No markdown, no code fences, no explanation:
{
  "content": "the full cover letter text with paragraph breaks"
}

--- RESUME ---
${resumeText}`;
}


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



