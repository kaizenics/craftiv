import { EXP_SPLIT_TOKEN } from "@/lib/prompts";

/**
 * Loose shape of the AI "improved resume" payload consumed by the AI resume tools.
 * Every field is best-effort because it comes back from the model.
 */
export interface ImprovedResume {
  summary?: string;
  experiences?: Array<{ jobTitle?: string; employer?: string; description?: string }>;
  educations?: Array<{ degree?: string; schoolName?: string; description?: string }>;
}

/** Splits model output into labelled blocks, honouring explicit "Label:\n..." headers. */
export function parseContentBlocks(
  content: string,
  fallbackLabel: string,
): Array<{ label: string; value: string }> {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const chunks = normalized
    .split(/\n{2,}/)
    .map((c) => c.trim())
    .filter((c) => Boolean(c) && c !== "---" && c !== EXP_SPLIT_TOKEN);
  return chunks.map((chunk, i) => {
    const labeled = chunk.match(/^([^:\n]{2,100}):\s*\n([\s\S]*)$/);
    if (labeled) return { label: labeled[1].trim(), value: labeled[2].trim() };
    return { label: chunks.length === 1 ? fallbackLabel : `${fallbackLabel} ${i + 1}`, value: chunk };
  });
}

/** Splits text into trimmed bullet lines, stripping any leading bullet glyph. */
export function getBulletLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-•*]\s*/, ""));
}

/** Flattens an improved-resume payload into a plain-text summary/experience/education view. */
export function formatResumeDataAsText(d: ImprovedResume): string {
  const parts: string[] = [];
  if (d.summary) parts.push(`Summary:\n${d.summary}`);
  if (Array.isArray(d.experiences)) {
    for (const exp of d.experiences) {
      if (exp.description?.trim()) {
        parts.push(`${exp.jobTitle || "Role"} at ${exp.employer || "Company"}:\n${exp.description}`);
      }
    }
  }
  if (Array.isArray(d.educations)) {
    for (const edu of d.educations) {
      if (edu.description?.trim()) {
        parts.push(`${edu.degree || "Degree"} at ${edu.schoolName || "School"}:\n${edu.description}`);
      }
    }
  }
  return parts.join("\n\n");
}
