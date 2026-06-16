import { escapeHtml } from "@/lib/html-sanitize";

/**
 * Converts plain cover-letter text into `<p>`-wrapped HTML paragraphs.
 *
 * Tries, in order: explicit blank-line breaks; inferred breaks before common
 * sign-offs ("Best regards," etc.); and finally sentence chunking into 3-4 blocks.
 * Each paragraph is HTML-escaped and single newlines become `<br/>`.
 */
export function plainToHtmlParagraphs(text: string): string {
  const normalized = text.replaceAll("\r", "").trim();
  if (!normalized) return "";

  // 1) Respect explicit paragraph breaks first.
  let paragraphs = normalized
    .split(/\n{2,}/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    // 2) If AI returns single-line output, infer natural paragraph boundaries.
    const compact = normalized
      .replace(/\s+(Best regards,|Kind regards,|Regards,|Sincerely,)/gi, "\n\n$1")
      .replace(/\s+(Thank you for your (time|consideration)\.)/gi, "\n\n$1");

    paragraphs = compact
      .split(/\n{2,}/)
      .map((segment) => segment.trim())
      .filter(Boolean);
  }

  if (paragraphs.length <= 1) {
    // 3) Final fallback: split by sentences into 3-4 readable blocks.
    const sentences = normalized
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (sentences.length >= 4) {
      const chunkCount = Math.min(4, Math.max(3, Math.ceil(sentences.length / 2)));
      const chunkSize = Math.ceil(sentences.length / chunkCount);
      const chunks: string[] = [];
      for (let i = 0; i < sentences.length; i += chunkSize) {
        chunks.push(sentences.slice(i, i + chunkSize).join(" "));
      }
      paragraphs = chunks;
    } else {
      paragraphs = [normalized];
    }
  }

  return paragraphs
    .map((segment) => `<p>${escapeHtml(segment).replaceAll(/\n/g, "<br/>")}</p>`)
    .join("");
}
