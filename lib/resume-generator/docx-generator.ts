import { ResumeData, TemplateLayout } from '@/lib/types/resume';
import { DesignOptions } from './styles';
import { generateResumeHTML } from './html-generator';

interface WordDocumentGeneratorOptions {
  data: ResumeData;
  template: { primaryColor: string; name: string; layout?: string };
  fileName: string;
  designOptions: DesignOptions;
  customColor?: string;
}

const INLINE_STYLE_PROPS = [
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'float',
  'clear',
  'width',
  'height',
  'max-width',
  'max-height',
  'min-width',
  'min-height',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-radius',
  'box-sizing',
  'background',
  'background-color',
  'color',
  'font',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-transform',
  'text-decoration',
  'white-space',
  'word-break',
  'overflow',
  'overflow-x',
  'overflow-y',
  'flex',
  'flex-direction',
  'flex-wrap',
  'justify-content',
  'align-items',
  'gap',
  'grid-template-columns',
  'grid-template-rows',
  'grid-column',
  'grid-row',
  'opacity',
];

function inlineComputedStyles(sourceRoot: HTMLElement, targetRoot: HTMLElement) {
  const sourceElements = [sourceRoot, ...Array.from(sourceRoot.querySelectorAll('*'))];
  const targetElements = [targetRoot, ...Array.from(targetRoot.querySelectorAll('*'))];

  sourceElements.forEach((sourceEl, index) => {
    const targetEl = targetElements[index] as HTMLElement | undefined;
    if (!(sourceEl instanceof HTMLElement) || !targetEl) return;

    const computed = window.getComputedStyle(sourceEl);
    const inlineStyles = INLINE_STYLE_PROPS
      .map((prop) => `${prop}:${computed.getPropertyValue(prop)};`)
      .join('');

    targetEl.setAttribute('style', inlineStyles);
  });
}

function buildWordHtml(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="ProgId" content="Word.Document">
      <meta name="Generator" content="Microsoft Word 15">
      <meta name="Originator" content="Microsoft Word 15">
      <style>
        @page { size: A4; margin: 0; }
        body { margin: 0; padding: 0; background: #ffffff; }
      </style>
    </head>
    <body>${content}</body>
    </html>
  `;
}

export async function generateDOCX({
  data,
  template,
  fileName,
  designOptions,
  customColor,
}: WordDocumentGeneratorOptions): Promise<Blob> {
  const previewElement = document.querySelector('[data-resume-export-preview] [data-resume-preview]') as HTMLElement | null;

  let htmlContent: string;

  if (previewElement) {
    const clonedElement = previewElement.cloneNode(true) as HTMLElement;

    clonedElement.style.width = '210mm';
    clonedElement.style.maxWidth = '210mm';
    clonedElement.style.minHeight = 'auto';
    clonedElement.style.margin = '0 auto';
    clonedElement.style.backgroundColor = '#ffffff';
    clonedElement.style.borderRadius = '0';
    clonedElement.style.boxShadow = 'none';
    clonedElement.style.overflow = 'visible';
    clonedElement.style.height = 'auto';

    const contentContainer = clonedElement.querySelector('[data-resume-content]') as HTMLElement | null;
    if (contentContainer) {
      contentContainer.style.overflow = 'visible';
      contentContainer.style.height = 'auto';
      contentContainer.style.maxHeight = 'none';
    }

    inlineComputedStyles(previewElement, clonedElement);

    clonedElement.querySelectorAll('[data-preview-header], [data-preview-footer], [data-page-break-indicator], button, input, select').forEach((el) => {
      el.remove();
    });

    htmlContent = buildWordHtml(clonedElement.outerHTML);
  } else {
    const fallbackHTML = generateResumeHTML({
      data,
      template: {
        primaryColor: customColor || template.primaryColor,
        layout: (template.layout as TemplateLayout) || 'classic'
      },
      designOptions
    });
    htmlContent = fallbackHTML;
  }

  const response = await fetch('/api/resume/doc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      html: htmlContent,
      fileName,
      requestId: crypto.randomUUID(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate DOC: ${errorText}`);
  }

  return await response.blob();
}
