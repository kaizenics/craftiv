import { ResumeData } from '@/lib/types/resume';
import { DesignOptions } from './styles';
import { ResumeTemplate } from '@/lib/types/resume';

interface PDFGeneratorOptions {
  data: ResumeData;
  template: ResumeTemplate;
  fileName: string;
  designOptions: DesignOptions;
  customColor?: string;
}

function inlineComputedStyles(sourceRoot: HTMLElement, targetRoot: HTMLElement) {
  const sourceNodes = [sourceRoot, ...Array.from(sourceRoot.querySelectorAll('*'))];
  const targetNodes = [targetRoot, ...Array.from(targetRoot.querySelectorAll('*'))];
  const nodeCount = Math.min(sourceNodes.length, targetNodes.length);

  for (let i = 0; i < nodeCount; i++) {
    const sourceNode = sourceNodes[i];
    const targetNode = targetNodes[i];

    if (!(targetNode instanceof HTMLElement)) continue;

    const computed = window.getComputedStyle(sourceNode);
    const cssText = Array.from(computed)
      .map((prop) => `${prop}:${computed.getPropertyValue(prop)};`)
      .join('');

    targetNode.style.cssText = cssText;
  }
}

function absolutizeMediaUrls(root: HTMLElement) {
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (!src) return;

    try {
      const absolute = new URL(src, window.location.origin).toString();
      img.setAttribute('src', absolute);
    } catch {
      // Keep original value if URL conversion fails.
    }
  });
}

export async function generatePDF({ 
  data,
  template,
  fileName, 
  designOptions,
  customColor 
}: PDFGeneratorOptions): Promise<Blob> {
  // Keep signature compatibility with existing call sites.
  void data;
  void template;
  void designOptions;
  void customColor;

  // Prefer the hidden export preview, then fall back to visible preview.
  let resumeElement = document.querySelector('[data-resume-export-preview] [data-resume-preview]') as HTMLElement | null;

  if (!resumeElement) {
    resumeElement = document.querySelector('[data-resume-preview]') as HTMLElement | null;
  }

  if (!resumeElement) {
    throw new Error('Resume preview element not found. Please ensure the resume is rendered on the page.');
  }

  const clonedElement = resumeElement.cloneNode(true) as HTMLElement;
  inlineComputedStyles(resumeElement, clonedElement);
  absolutizeMediaUrls(clonedElement);
  const pageBackgroundColor = window.getComputedStyle(resumeElement).backgroundColor || '#ffffff';

  clonedElement.querySelectorAll('button, input, select, textarea, [data-pagination], [data-score], [data-preview-header], [data-preview-footer], [data-page-break-indicator]').forEach((el) => {
    el.remove();
  });

  const fontLinks = Array.from(document.querySelectorAll('head link[rel="preconnect"], head link[rel="stylesheet"]'))
    .filter((el) => {
      const href = el.getAttribute('href') || '';
      return href.includes('fonts.googleapis.com') || href.includes('fonts.gstatic.com');
    })
    .map((el) => el.outerHTML)
    .join('\n');

  const printableHtml = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base href="${window.location.origin}/" />
    ${fontLinks}
    <style>
      @page {
        size: A4;
        margin: 0;
      }

      html, body {
        margin: 0;
        padding: 0;
        background: ${pageBackgroundColor};
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      [data-resume-preview] {
        width: 210mm !important;
        max-width: 210mm !important;
        margin: 0 auto !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        background: ${pageBackgroundColor} !important;
      }
    </style>
  </head>
  <body>
    ${clonedElement.outerHTML}
  </body>
</html>
  `.trim();

  const response = await fetch('/api/resume/pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      html: printableHtml,
      fileName,
      requestId: crypto.randomUUID(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate PDF: ${errorText}`);
  }

  const blob = await response.blob();
  return blob;
}
 
