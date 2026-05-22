import type { Page } from "playwright-core";

const SCRIPT_TAG_REGEX = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
const EVENT_HANDLER_REGEX = /\son[a-z]+\s*=\s*(['"]).*?\1/gi;
const JS_URL_REGEX = /(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi;

export const MAX_PDF_HTML_BYTES = 5_000_000;
export const MAX_PDF_REQUEST_BYTES = MAX_PDF_HTML_BYTES + 250_000;

export function sanitizeHtmlForPdf(input: string) {
  return input
    .replace(SCRIPT_TAG_REGEX, "")
    .replace(EVENT_HANDLER_REGEX, "")
    .replace(JS_URL_REGEX, '$1="#"');
}

export async function hardenPdfPage(page: Page, allowedOrigin: string) {
  const allowedExternalOrigins = [
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com",
  ];

  await page.route("**/*", async (route) => {
    const req = route.request();
    const url = req.url();
    const lower = url.toLowerCase();
    const isDocument = req.resourceType() === "document";
    const allowedProtocol =
      lower.startsWith("about:") ||
      lower.startsWith("data:") ||
      lower.startsWith("blob:");
    const sameOrigin = lower.startsWith(allowedOrigin.toLowerCase());
    const whitelistedExternal = allowedExternalOrigins.some((origin) =>
      lower.startsWith(origin),
    );
    const allowed = isDocument || allowedProtocol || sameOrigin || whitelistedExternal;
    if (allowed) {
      await route.continue();
      return;
    }
    await route.abort("blockedbyclient");
  });
}
