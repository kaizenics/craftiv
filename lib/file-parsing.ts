import mammoth from "mammoth";

/** Beyond this a document is treated as hostile rather than merely long. */
const MAX_PDF_PAGES = 50;

/**
 * Pulls the text out of a PDF with pdf.js.
 *
 * These bytes come from an upload, so the parser is the attack surface: this
 * previously ran on pdf-parse, which vendors pdf.js builds from 2018 and is no
 * longer maintained — years of parser fixes behind, in a process with no
 * sandbox around it. pdfjs-dist is the same parser, maintained.
 *
 * The font path that CVE-2024-4367 turned into arbitrary execution was removed
 * upstream, so there is no eval switch left to disable on this version. Font
 * handling is switched off regardless — text extraction never needs it — and the
 * page count is capped so a deeply-paginated file cannot occupy the process
 * indefinitely.
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // The legacy build is the one that runs outside a browser.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const task = pdfjs.getDocument({
    // A copy: pdf.js transfers ownership of the buffer it is handed and would
    // detach the caller's.
    data: new Uint8Array(buffer),
    useSystemFonts: false,
    disableFontFace: true,
    // Nothing is rendered, so never reach out for a font or a colour profile.
    standardFontDataUrl: undefined,
    isImageDecoderSupported: false,
  });

  const doc = await task.promise;
  try {
    const pages: string[] = [];
    const pageCount = Math.min(doc.numPages, MAX_PDF_PAGES);

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      try {
        const content = await page.getTextContent();

        /**
         * Rebuild the line structure rather than flattening the page to one
         * string. Callers read layout out of it: the ATS route decides whether
         * an upload is even a resume partly by looking for bullet lines, and the
         * parse prompt reads far better with the original line breaks intact.
         */
        const lines: string[] = [];
        let current = "";

        for (const item of content.items) {
          if (!("str" in item)) continue;
          current += item.str;
          if (item.hasEOL) {
            lines.push(current.replace(/\s+/g, " ").trim());
            current = "";
          }
        }
        if (current.trim()) lines.push(current.replace(/\s+/g, " ").trim());

        pages.push(lines.join("\n").replace(/\n{3,}/g, "\n\n").trim());

      } finally {
        page.cleanup();
      }
    }

    return pages.filter(Boolean).join("\n\n");
  } finally {
    await task.destroy();
  }
}

/**
 * Server-side document text extraction shared by the resume-parse and ATS-check
 * routes. Both parsers are imported dynamically so neither reaches the client
 * bundle.
 */
export async function extractTextFromFile(buffer: Buffer, isPDF: boolean): Promise<string> {
  if (isPDF) {
    return extractTextFromPdf(buffer);
  }

  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export interface UploadKind {
  isPDF: boolean;
  isDOCX: boolean;
  isSupported: boolean;
}

/** Classifies an uploaded file by extension. Only PDF and DOCX are supported. */
export function getUploadKind(fileName: string): UploadKind {
  const lower = fileName.toLowerCase();
  const isPDF = lower.endsWith(".pdf");
  const isDOCX = lower.endsWith(".docx");
  return { isPDF, isDOCX, isSupported: isPDF || isDOCX };
}
