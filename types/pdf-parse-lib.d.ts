declare module "pdf-parse/lib/pdf-parse.js" {
  export default function pdfParse(input: Buffer): Promise<{ text: string }>;
}
