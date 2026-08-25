import DOMPurify from "isomorphic-dompurify";
import type { Page, Request as PlaywrightRequest } from "playwright-core";

export const MAX_PDF_HTML_BYTES = 5_000_000;
export const MAX_PDF_REQUEST_BYTES = MAX_PDF_HTML_BYTES + 250_000;

/** The only origins the renderer may reach beyond the app's own. */
const FONT_ORIGINS = ["https://fonts.googleapis.com", "https://fonts.gstatic.com"];

/** Schemes that carry their content inline and never touch the network. */
const INLINE_SCHEME = /^(?:about|data|blob):/i;

/**
 * Strips anything executable from caller-supplied export markup.
 *
 * This runs on HTML posted by the client and handed to two places that will act
 * on it: headless Chromium, and — for the .doc/.docx exports — the user's word
 * processor. The previous regex pass only matched quoted handler values, so
 * `<img src=x onerror=fetch(...)>` went through untouched. DOMPurify parses the
 * markup instead of pattern-matching it, which is the only way to be sure.
 */
export function sanitizeHtmlForPdf(input: string) {
  return DOMPurify.sanitize(input, {
    // The export pipeline sends a whole document, and the tags carrying its
    // styling are not in DOMPurify's default allowlist: <base> resolves the
    // relative URLs, the <link>s pull the fonts, <style> holds the layout.
    // Dropping them silently yields an unstyled PDF rather than an error.
    WHOLE_DOCUMENT: true,
    ADD_TAGS: ["base", "link", "meta", "style"],
    ADD_ATTR: ["href", "rel", "crossorigin", "charset", "content", "media", "sizes", "type"],
    // Belt and braces: DOMPurify drops these by default, but they are exactly
    // the tags that would turn the renderer into a fetching proxy, so the intent
    // is stated rather than inherited.
    FORBID_TAGS: ["script", "iframe", "frame", "frameset", "object", "embed", "applet", "noscript"],
    ALLOW_DATA_ATTR: true,
  });
}

function isMainFrameRequest(request: PlaywrightRequest, page: Page): boolean {
  try {
    return request.frame() === page.mainFrame();
  } catch {
    // A detached frame cannot be proven to be the main one. Fail closed.
    return false;
  }
}

/**
 * Confines the render to the app's own origin plus the font CDNs.
 *
 * The page content is caller-supplied, so every request it provokes is really a
 * request the caller chose. Two holes are closed here:
 *
 * Document requests used to be allowed unconditionally, ahead of every other
 * check — and an <iframe> is a document request. `<iframe src="http://169.254.
 * 169.254/latest/meta-data/">` in the posted HTML made Chromium fetch the cloud
 * metadata endpoint and paint the response into the PDF returned to the caller.
 * Any internal service the container can reach was readable the same way.
 *
 * The origin test was `startsWith`, so an attacker-controlled host merely had to
 * begin with the app's origin — https://app.example.com.evil.test passes a
 * prefix check and fails an equality one.
 */
export async function hardenPdfPage(page: Page, allowedOrigin: string) {
  const allowedOrigins = new Set<string>(FONT_ORIGINS);
  try {
    allowedOrigins.add(new URL(allowedOrigin).origin);
  } catch {
    // An unparseable origin grants nothing rather than everything.
  }

  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = request.url();

    if (INLINE_SCHEME.test(url)) {
      await route.continue();
      return;
    }

    // Subframe navigation: the caller's markup asking us to fetch something and
    // render it into their PDF. No template needs a frame.
    if (request.resourceType() === "document" && !isMainFrameRequest(request, page)) {
      await route.abort("blockedbyclient");
      return;
    }

    let origin: string;
    try {
      origin = new URL(url).origin;
    } catch {
      await route.abort("blockedbyclient");
      return;
    }

    if (allowedOrigins.has(origin)) {
      await route.continue();
      return;
    }

    await route.abort("blockedbyclient");
  });
}
