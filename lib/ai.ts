import OpenAI from "openai";
import { TRPCError } from "@trpc/server";

import type { ResumeDataJSON } from "@/db/schema";
import { ownAiComplete, type OwnAiConnection } from "@/lib/own-ai";


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

/**
 * Which AI runs a request: Craftiv's own (paid for with credits) or the user's
 * own provider and key. Resolved per request by lib/own-ai-access.ts.
 */
export type AiConnection = { source: "craftiv" } | ({ source: "own" } & OwnAiConnection);

export const CRAFTIV_AI: AiConnection = { source: "craftiv" };

export async function callWithFallback(
  params: AiCallParams,
  ai: AiConnection = CRAFTIV_AI,
): Promise<{ content: string; model: string }> {
  if (ai.source === "own") {
    const content = await ownAiComplete(ai, params);
    return { content, model: ai.model };
  }

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



