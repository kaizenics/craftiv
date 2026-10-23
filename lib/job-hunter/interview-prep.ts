import { z } from "zod";

import { callWithFallback, extractJsonObject, type AiConnection } from "@/lib/ai";
import { buildInterviewPrepPrompt } from "@/lib/prompts";
import type { ResumeDataJSON } from "@/db/schema/resumes";

const questionSchema = z.object({
  question: z.string().min(5).max(400),
  type: z.enum(["role", "behavioural", "motivation"]).catch("role"),
  answer: z.string().min(1).max(1500),
  tip: z.string().max(400).optional().default(""),
});

const responseSchema = z.object({
  questions: z.array(questionSchema).min(1).max(12),
});

export type InterviewQuestion = z.infer<typeof questionSchema>;

export class InterviewPrepError extends Error {}

/** One model call; the reply is validated so a malformed or hijacked answer never reaches the user. */
export async function generateInterviewPrep(params: {
  resumeData: ResumeDataJSON;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  round?: { stage: string; interviewer: string };
  ai?: AiConnection;
}): Promise<InterviewQuestion[]> {
  const prompt = buildInterviewPrepPrompt(params);
  const { content } = await callWithFallback(
    { messages: [{ role: "user", content: prompt }], maxTokens: 3500, temperature: 0.4 },
    params.ai,
  );

  const raw = extractJsonObject(content);
  if (!raw) throw new InterviewPrepError("The interview prep reply was not readable.");
  const parsed = responseSchema.safeParse(raw);
  if (!parsed.success) throw new InterviewPrepError("The interview prep reply had the wrong shape.");
  return parsed.data.questions;
}
