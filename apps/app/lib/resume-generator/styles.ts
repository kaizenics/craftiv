import { TemplateLayout } from '@/lib/types/resume';

export interface DesignOptions {
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  sectionSpacing: number;
  paragraphSpacing: number;
}

export const defaultDesignOptions: DesignOptions = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 11,
  lineSpacing: 1.6,
  sectionSpacing: 20,
  paragraphSpacing: 12,
};

export function getLayoutStyles(
  layout: TemplateLayout,
  primaryColor: string,
  designOptions: DesignOptions
): string {
  switch (layout) {
    case 'harvard':
      return `
        .header { text-align: center; margin-bottom: ${designOptions.sectionSpacing}px; border-bottom: 1px solid #1e1e1e; padding-bottom: 15px; }
        .name { font-size: 22pt; font-weight: bold; color: #1e1e1e; text-transform: uppercase; letter-spacing: 1px; }
        .section-title { 
          font-size: 11pt; 
          font-weight: bold; 
          color: #1e1e1e; 
          text-transform: uppercase; 
          letter-spacing: 1px;
          border-bottom: 1px solid #1e1e1e; 
          padding-bottom: 3px; 
          margin-bottom: ${designOptions.paragraphSpacing}px; 
        }
        .entry-title { font-weight: bold; color: #1e1e1e; }
        .entry-position { font-style: italic; }
      `;
    case 'modern':
      return `
        .header { text-align: left; margin-bottom: ${designOptions.sectionSpacing}px; border-bottom: 3px solid ${primaryColor}; padding-bottom: 15px; }
        .name { font-size: 26pt; font-weight: bold; color: ${primaryColor}; }
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          color: ${primaryColor}; 
          text-transform: uppercase; 
          border-bottom: 2px solid ${primaryColor}; 
          padding-bottom: 5px; 
          margin-bottom: ${designOptions.paragraphSpacing}px; 
        }
      `;
    case 'bold':
      return `
        .header { background: ${primaryColor}; color: white; padding: 30px; margin: -40px -40px 20px -40px; }
        .name { font-size: 28pt; font-weight: bold; color: white; text-transform: uppercase; }
        .title { color: rgba(255,255,255,0.8); }
        .contact-info { color: rgba(255,255,255,0.7); }
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          color: white; 
          text-transform: uppercase; 
          background: ${primaryColor};
          padding: 5px 10px;
          margin-bottom: ${designOptions.paragraphSpacing}px; 
        }
        .entry { border-left: 4px solid ${primaryColor}; padding-left: 15px; }
      `;
    case 'minimal':
      return `
        .header { text-align: center; margin-bottom: ${designOptions.sectionSpacing}px; }
        .name { font-size: 22pt; font-weight: 600; color: #333; }
        .title { color: #666; }
        .contact-info { color: #999; }
        .section-title { 
          font-size: 11pt; 
          font-weight: 600; 
          color: #333; 
          text-transform: uppercase; 
          border-bottom: 1px solid #ddd; 
          padding-bottom: 5px; 
          margin-bottom: ${designOptions.paragraphSpacing}px; 
        }
      `;
    case 'executive':
      return `
        .header { margin-bottom: ${designOptions.sectionSpacing}px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 15px; }
        .name { font-size: 28pt; font-weight: bold; color: ${primaryColor}; }
        .summary { border-left: 4px solid ${primaryColor}; padding-left: 15px; font-style: italic; }
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          color: ${primaryColor}; 
          text-transform: uppercase; 
          border-bottom: 2px solid ${primaryColor}; 
          padding-bottom: 5px; 
          margin-bottom: ${designOptions.paragraphSpacing}px; 
        }
      `;
    case 'sidebar':
      return `
        .header { text-align: center; margin-bottom: ${designOptions.sectionSpacing}px; }
        .name { font-size: 22pt; font-weight: bold; color: ${primaryColor}; }
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          color: ${primaryColor}; 
          text-transform: uppercase; 
          border-bottom: 2px solid ${primaryColor}; 
          padding-bottom: 5px; 
          margin-bottom: ${designOptions.paragraphSpacing}px; 
        }
      `;
    case 'classic':
    default:
      return `
        .header { text-align: center; margin-bottom: ${designOptions.sectionSpacing}px; border-top: 4px solid ${primaryColor}; padding-top: 20px; }
        .name { font-size: 24pt; font-weight: bold; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 2px; }
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          color: ${primaryColor}; 
          text-transform: uppercase; 
          border-bottom: 2px solid ${primaryColor}; 
          padding-bottom: 5px; 
          margin-bottom: ${designOptions.paragraphSpacing}px; 
        }
      `;
  }
}

export function getBaseStyles(designOptions: DesignOptions): string {
  return `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: ${designOptions.fontFamily}; 
        font-size: ${designOptions.fontSize}pt; 
        line-height: ${designOptions.lineSpacing};
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 40px;
      }
      .title { font-size: 12pt; color: #666; margin-top: 5px; }
      .contact-info { font-size: 10pt; color: #666; margin-top: 10px; }
      .section { margin-bottom: ${designOptions.sectionSpacing}px; page-break-inside: avoid; }
      .entry { margin-bottom: ${designOptions.paragraphSpacing}px; page-break-inside: avoid; }
      .entry-header { display: flex; justify-content: space-between; }
      .entry-title { font-weight: bold; }
      .entry-date { color: #666; font-size: 10pt; }
      .entry-subtitle { color: #666; font-size: 10pt; }
      .entry-description { margin-top: 5px; font-size: 10pt; white-space: pre-line; }
      .skills-list { display: flex; flex-wrap: wrap; gap: 8px; }
      .skill-tag { background: #f0f0f0; padding: 3px 10px; border-radius: 3px; font-size: 10pt; }
      .summary { font-size: 10pt; color: #444; }
      .page-break { page-break-before: always; }
      @media print {
        body { padding: 20px; }
        @page { 
          margin: 0.5in; 
          size: letter;
        }
        @page { margin-top: 0.5in; margin-bottom: 0.5in; }
        html, body { height: 100%; width: 100%; }
      }
      @page { 
        margin-header: 0mm;
        margin-footer: 0mm;
      }
    </style>
  `;
}
