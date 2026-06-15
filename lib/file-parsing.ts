import mammoth from "mammoth";

/**
 * Server-side document text extraction shared by the resume-parse and ATS-check
 * routes. PDFs are read with pdf-parse (loaded dynamically so it is not bundled
 * into the client) and DOCX files with mammoth.
 */
export async function extractTextFromFile(buffer: Buffer, isPDF: boolean): Promise<string> {
  if (isPDF) {
    const pdfParseModule = await import("pdf-parse/lib/pdf-parse.js");
    const pdfParse = pdfParseModule.default as (input: Buffer) => Promise<{ text: string }>;
    const result = await pdfParse(buffer);
    return result.text;
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
