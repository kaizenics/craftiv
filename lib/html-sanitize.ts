/**
 * Small, dependency-free string helpers shared by the cover-letter export paths
 * (the download dialog and the writer page). Only genuinely identical helpers
 * live here; bespoke paragraph/strip logic stays with its single caller.
 */

/** Escapes the five HTML-significant characters for safe interpolation into markup. */
export function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** Turns an arbitrary title into a filesystem-safe file name, falling back when empty. */
export function toSafeFileName(value: string, fallback = "document"): string {
  return (value || fallback)
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
}
