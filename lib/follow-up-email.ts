import { z } from "zod";

import { callWithFallback, extractJsonObject, type AiConnection } from "@/lib/ai";
import { buildFollowUpEmailPrompt } from "@/lib/prompts";

const responseSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(20).max(2000),
});

export type FollowUpEmail = z.infer<typeof responseSchema>;

export class FollowUpEmailError extends Error {}

/** One model call; the reply is validated so a malformed or hijacked answer never reaches the user. */
export async function generateFollowUpEmail(
  params: Parameters<typeof buildFollowUpEmailPrompt>[0] & { ai?: AiConnection },
): Promise<FollowUpEmail> {
  const { content } = await callWithFallback(
    { messages: [{ role: "user", content: buildFollowUpEmailPrompt(params) }], maxTokens: 600, temperature: 0.5 },
    params.ai,
  );
  const raw = extractJsonObject(content);
  if (!raw) throw new FollowUpEmailError("The follow-up reply was not readable.");
  const parsed = responseSchema.safeParse(raw);
  if (!parsed.success) throw new FollowUpEmailError("The follow-up reply had the wrong shape.");
  return parsed.data;
}
