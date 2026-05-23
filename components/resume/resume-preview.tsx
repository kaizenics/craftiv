'use client';

import { ResumeData, ResumeSectionKey, TemplateLayout, normalizeSectionOrder } from '@/lib/types/resume';
import { resumeTemplates } from '@/lib/resume-templates';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Loader2, AlertCircle } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

// Design options interface
export interface DesignOptions {
  fontFamily: string;
  fontSize: number;
  sectionSpacing: number;
  paragraphSpacing: number;
  lineSpacing: number;
}

export const defaultDesignOptions: DesignOptions = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 11,
  sectionSpacing: 16,
  paragraphSpacing: 8,
  lineSpacing: 1.5,
};

const A4_PAGE_HEIGHT_MM = 297;
const A4_PAGE_WIDTH_MM = 210;
const SIDEBAR_WIDTH_MM = 70;
const MM_TO_PX = 96 / 25.4;

// Helper component for section headers based on layout
interface SectionHeaderProps {
  title: string;
  layout: TemplateLayout;
  color: string;
  spacing: number;
}

function SectionHeader({ title, layout, color, spacing }: SectionHeaderProps) {
  switch (layout) {
    case 'harvard':
      return (
        <h2
          className="font-bold uppercase tracking-wider border-b border-zinc-900 pb-1"
          style={{ marginBottom: `${spacing}px`, fontSize: '0.85em' }}
        >
          {title}
        </h2>
      );
    case 'modern':
      return (
        <h2
          className="font-bold uppercase tracking-wide pb-1"
          style={{ 
            color, 
            borderBottom: `2px solid ${color}`,
            marginBottom: `${spacing}px` 
          }}
        >
          {title}
        </h2>
      );
    case 'bold':
      return (
        <h2
          className="font-bold uppercase tracking-wide text-white px-2 py-1"
          style={{ 
            backgroundColor: color,
            marginBottom: `${spacing}px` 
          }}
        >
          {title}
        </h2>
      );
    case 'minimal':
      return (
        <h2
          className="font-semibold uppercase tracking-wide text-zinc-800 border-b border-zinc-200 pb-1"
          style={{ marginBottom: `${spacing}px` }}
        >
          {title}
        </h2>
      );
    case 'executive':
      return (
        <h2
          className="font-bold uppercase tracking-wide pb-1"
          style={{ 
            color, 
            borderBottom: `2px solid ${color}`,
            marginBottom: `${spacing}px` 
          }}
        >
          {title}
        </h2>
      );
    case 'sidebar':
    case 'classic':
    default:
      return (
        <h2
          className="font-bold uppercase tracking-wide border-b pb-1"
          style={{
            color,
            borderColor: color,
            marginBottom: `${spacing}px`
          }}
        >
          {title}
        </h2>
      );
  }
}

function formatDateRange(start?: string, end?: string): string {
  const startValue = start?.trim() ?? "";
  const endValue = end?.trim() ?? "";

  if (!startValue && !endValue) return "";
  if (startValue && endValue) return `${startValue} - ${endValue}`;
  return startValue || endValue;
}

function renderRichDescription(
  text: string,
  paragraphClassName: string,
  listClassName?: string,
) {
  const lines = text
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const bulletPattern = /^(?:-|•|\*)\s+/;
  const hasBullets = lines.some((line) => bulletPattern.test(line));

  if (!hasBullets) {
    return <p className={paragraphClassName}>{text}</p>;
  }

  const nodes: React.ReactNode[] = [];
  let bufferedBullets: string[] = [];

  const flushBullets = () => {
    if (bufferedBullets.length === 0) return;
    const listKey = `list-${nodes.length}`;
    nodes.push(
      <ul key={listKey} className={listClassName ?? "mt-1 list-disc space-y-1 pl-5 text-zinc-600"}>
        {bufferedBullets.map((line, index) => (
          <li key={`${listKey}-${index}`}>{line.replace(bulletPattern, "")}</li>
        ))}
      </ul>,
    );
    bufferedBullets = [];
  };

  lines.forEach((line, index) => {
    if (bulletPattern.test(line)) {
      bufferedBullets.push(line);
      return;
    }

    flushBullets();
    nodes.push(
      <p key={`p-${index}`} className={paragraphClassName}>
        {line}
      </p>,
    );
  });

  flushBullets();
  return <div className="space-y-1">{nodes}</div>;
}
interface ResumePreviewProps {
  data: ResumeData;
  className?: string;
  designOptions?: DesignOptions;
  customColor?: string;
  showScore?: boolean;
  showFooter?: boolean;
  plain?: boolean;
  showPhoto?: boolean;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  renderAllPages?: boolean; // For PDF export - renders all pages at once
  saveStatus?: "saving" | "saved" | "error";
}

export function ResumePreview({ 
  data, 
  className,
  designOptions = defaultDesignOptions,
  customColor,
  showScore = true,
  showFooter,
  plain = false,
  showPhoto = false,
  currentPage: controlledPage,
  onPageChange,
  renderAllPages = false,
  saveStatus = "saved",
}: ResumePreviewProps) {
  const template = resumeTemplates.find((t) => t.id === data.templateId) || resumeTemplates[0];
  const templateId = template.id;
  const [internalPage, setInternalPage] = useState(1);
  const [measuredTotalPages, setMeasuredTotalPages] = useState(1);
  const pdfContentRef = useRef<HTMLDivElement>(null);
  
  // Use custom color if provided, otherwise use template's primary color
  const activeColor = customColor || template.primaryColor;
  
  // Use controlled or uncontrolled page state
  const currentPage = controlledPage !== undefined ? controlledPage : internalPage;
  const setCurrentPage = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    } else {
      setInternalPage(page);
    }
  };

  useEffect(() => {
    const contentEl = pdfContentRef.current;
    if (!contentEl) return;

    let rafId: number | null = null;

    const measurePages = () => {
      const pageHeightPx = A4_PAGE_HEIGHT_MM * MM_TO_PX;
      let contentHeightPx = contentEl.scrollHeight;

      // Orbit uses a sidebar stretched to document height for visual consistency.
      // Measure pages from the main content column so the decorative sidebar
      // does not create an extra blank page.
      if (templateId === 'orbit') {
        const orbitMain = contentEl.querySelector('[data-orbit-main]') as HTMLElement | null;
        if (orbitMain) {
          contentHeightPx = orbitMain.scrollHeight;
        }
      } else {
        const previousMinHeight = contentEl.style.minHeight;
        contentEl.style.minHeight = '0px';
        contentHeightPx = contentEl.scrollHeight;
        contentEl.style.minHeight = previousMinHeight;
      }

      const nextPages = Math.max(1, Math.ceil(contentHeightPx / pageHeightPx));
      setMeasuredTotalPages((prev) => (prev === nextPages ? prev : nextPages));
    };

    const scheduleMeasure = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(measurePages);
    };

    scheduleMeasure();

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(contentEl);
    window.addEventListener('resize', scheduleMeasure);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      observer.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, [data, designOptions, renderAllPages, templateId]);

  const totalPages = measuredTotalPages;
  const visiblePage = renderAllPages ? 1 : Math.min(currentPage, totalPages);
  const layout = template.layout || 'classic';
  const shouldRenderPhoto = templateId === 'orbit' ? true : showPhoto;
  const totalDocumentHeightMm = Math.max(1, totalPages) * A4_PAGE_HEIGHT_MM;
  const pageBackgroundColor = templateId === 'boardroom' ? '#fbfbfa' : '#ffffff';
  const isSidebarLayout = layout === 'sidebar' && templateId === 'astral';
  const shouldShowFooter = showFooter ?? !renderAllPages;
  const shouldShowScore = showScore && !renderAllPages;
  const orderedSections = normalizeSectionOrder(data.sectionOrder);

  // Render the appropriate layout
  const renderResumeContent = () => {
    switch (templateId) {
      case 'orbit':
        return renderOrbitLayout();
      case 'stellar':
        return renderStellarLayout();
      case 'aurora':
        return renderAuroraLayout();
      case 'zenith':
        return renderZenithLayout();
      case 'pulse':
        return renderPulseLayout();
      case 'classic':
        return renderClassicTemplateLayout();
      case 'metro':
        return renderMetroLayout();
      case 'bold':
        return renderBoldTemplateLayout();
      case 'boardroom':
        return renderBoardroomLayout();
    }

    switch (layout) {
      case 'harvard':
        return renderHarvardLayout();
      case 'modern':
        return renderModernLayout();
      case 'sidebar':
        return renderSidebarLayout();
      case 'bold':
        return renderBoldLayout();
      case 'minimal':
        return renderMinimalLayout();
      case 'executive':
        return renderExecutiveLayout();
      case 'classic':
      default:
        return renderClassicLayout();
    }
  };

  const renderOrderedSectionBlocks = (
    layoutType: TemplateLayout,
    options?: {
      summaryTitle?: string;
      experienceTitle?: string;
      educationTitle?: string;
      skillsTitle?: string;
      summaryNoHeader?: boolean;
      skillsAsList?: boolean;
    },
  ) => (
    <>
      {orderedSections.map((sectionKey) => {
        if (sectionKey === 'summary' && data.summary) {
          if (options?.summaryNoHeader) {
            return (
              <div key="summary" style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
                <p className="text-zinc-600 italic border-l-4 pl-4" style={{ borderColor: activeColor }}>
                  {data.summary}
                </p>
              </div>
            );
          }
          return (
            <div key="summary" style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title={options?.summaryTitle || "Summary"} layout={layoutType} color={activeColor} spacing={designOptions.paragraphSpacing} />
              <p className="text-zinc-600 whitespace-pre-line">{data.summary}</p>
            </div>
          );
        }

        if (sectionKey === 'experience' && data.experiences.length > 0) {
          return (
            <div key="experience" style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title={options?.experienceTitle || "Experience"} layout={layoutType} color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
                {data.experiences.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="font-semibold text-zinc-900">{exp.jobTitle || 'Role'}</p>
                        {layoutType === 'harvard' ? (
                          <>
                            <p className="text-zinc-700">{exp.employer || 'Company'}</p>
                            {exp.location && <p className="text-zinc-500 text-[0.92em]">{exp.location}</p>}
                          </>
                        ) : (
                          <p className="text-zinc-700">{exp.employer || 'Company'}{exp.location ? `, ${exp.location}` : ''}</p>
                        )}
                      </div>
                      <p className="text-zinc-500 text-[0.92em]">{formatDateRange(exp.startDate, exp.isCurrentJob ? 'Present' : exp.endDate)}</p>
                    </div>
                    {exp.description && renderRichDescription(exp.description, "text-zinc-600 mt-1 whitespace-pre-line")}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (sectionKey === 'education' && data.educations.length > 0) {
          return (
            <div key="education" style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title={options?.educationTitle || "Education"} layout={layoutType} color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
                {data.educations.map((edu) => (
                  <div key={edu.id}>
                    <p className="font-semibold text-zinc-900">{edu.degree || 'Degree'}</p>
                    <p className="text-zinc-700">{edu.schoolName || 'School'}{edu.location ? `, ${edu.location}` : ''}</p>
                    <p className="text-zinc-500 text-[0.92em]">{formatDateRange(edu.startDate, edu.endDate)}</p>
                    {edu.description && renderRichDescription(edu.description, "text-zinc-600 mt-1 text-[1.08em]")}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (sectionKey === 'skills' && data.skills.length > 0) {
          return (
            <div key="skills" style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title={options?.skillsTitle || "Skills"} layout={layoutType} color={activeColor} spacing={designOptions.paragraphSpacing} />
              {options?.skillsAsList ? (
                <p className="text-zinc-700">{data.skills.map((skill) => skill.name).join(', ')}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.skills.map((skill) => (
                    <span key={skill.id} className="rounded bg-gray-100 px-2 py-1 text-zinc-700">
                      {skill.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        }

        if (sectionKey === 'languages' && data.finalize.languages.length > 0) {
          return (
            <div key="languages" style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Languages" layout={layoutType} color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div className="flex flex-wrap gap-3">
                {data.finalize.languages.map((lang) => (
                  <span key={lang.id}>{lang.name} ({lang.proficiency})</span>
                ))}
              </div>
            </div>
          );
        }

        if (sectionKey === 'certifications' && data.finalize.certifications.length > 0) {
          return (
            <div key="certifications" style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Certifications" layout={layoutType} color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {data.finalize.certifications.map((cert) => (
                  <p key={cert.id}>{cert.name}{cert.issuer ? ` - ${cert.issuer}` : ''}{cert.date ? ` (${cert.date})` : ''}</p>
                ))}
              </div>
            </div>
          );
        }

        if (sectionKey === 'awards' && data.finalize.awards.length > 0) {
          return (
            <div key="awards" style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Awards & Honors" layout={layoutType} color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {data.finalize.awards.map((award) => (
                  <p key={award.id}>{award.title} - {award.issuer}{award.date ? ` (${award.date})` : ''}</p>
                ))}
              </div>
            </div>
          );
        }

        if (sectionKey === 'websites' && data.finalize.websites.length > 0) {
          return (
            <div key="websites" style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Links" layout={layoutType} color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div className="flex flex-wrap gap-4">
                {data.finalize.websites.map((site) => (
                  <span key={site.id} className="text-blue-600">{site.label}: {site.url}</span>
                ))}
              </div>
            </div>
          );
        }

        if (sectionKey === 'references' && data.finalize.references.length > 0) {
          return (
            <div key="references" style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="References" layout={layoutType} color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
                {data.finalize.references.map((ref) => (
                  <div key={ref.id}>
                    <p className="font-semibold">{ref.name}</p>
                    <p className="text-gray-600">{ref.position}{ref.company ? `, ${ref.company}` : ''}</p>
                    <p className="text-gray-500">{ref.email} {ref.phone && `| ${ref.phone}`}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (sectionKey === 'hobbies' && data.finalize.hobbies.length > 0) {
          return (
            <div key="hobbies" style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Hobbies & Interests" layout={layoutType} color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div className="flex flex-wrap gap-2">
                {data.finalize.hobbies.map((hobby) => (
                  <span key={hobby.id} className="bg-gray-100 px-2 py-1 rounded">{hobby.name}</span>
                ))}
              </div>
            </div>
          );
        }

        if (sectionKey === 'custom' && data.finalize.customSections.length > 0) {
          return (
            <div key="custom-group">
              {data.finalize.customSections.map((section) => (
                <div key={section.id} style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
                  <SectionHeader title={section.sectionName} layout={layoutType} color={activeColor} spacing={designOptions.paragraphSpacing} />
                  <p className="text-gray-600">{section.description}</p>
                </div>
              ))}
            </div>
          );
        }

        return null;
      })}
    </>
  );

  // Harvard Layout - Education first, clean professional format
  const renderHarvardLayout = () => (
    <div
      className="p-8 bg-white"
      style={{ 
        fontSize: `${designOptions.fontSize}px`,
        lineHeight: designOptions.lineSpacing
      }}
    >
      {/* Harvard Header - Name centered, contact below */}
      <div className="text-center pb-3" style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
        {showPhoto && data.contact.photoUrl && (
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-zinc-200 mb-3">
            <Image src={data.contact.photoUrl} alt="Profile" width={96} height={96} className="object-cover w-full h-full" />
          </div>
        )}
        <h1 className="text-2xl font-bold uppercase tracking-wide text-zinc-900">
          {data.contact.firstName || 'YOUR'} {data.contact.lastName || 'NAME'}
        </h1>
        {data.contact.desiredJobTitle && (
          <p className="mt-1 text-zinc-600 text-[1.08em]">{data.contact.desiredJobTitle}</p>
        )}
        <div className="flex justify-center items-center gap-3 mt-2 text-sm text-zinc-600">
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.email && data.contact.phone && <span>•</span>}
          {data.contact.phone && <span>{data.contact.phone}</span>}
        </div>
      </div>

      {renderOrderedSectionBlocks('harvard', {
        summaryTitle: 'Summary',
        experienceTitle: 'Experience',
        educationTitle: 'Education',
        skillsTitle: 'Skills & Interests',
        skillsAsList: true,
      })}
    </div>
  );

  // Modern Layout - Two columns with accent border
  const renderModernLayout = () => (
    <div
      className="bg-white"
      style={{ 
        fontSize: `${designOptions.fontSize}px`,
        lineHeight: designOptions.lineSpacing
      }}
    >
      {/* Header with accent */}
      <div className="p-6 pb-4" style={{ borderBottom: `3px solid ${activeColor}` }}>
        <div className="flex items-center gap-4">
          {showPhoto && data.contact.photoUrl && (
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-zinc-200 shrink-0">
              <Image src={data.contact.photoUrl} alt="Profile" width={80} height={80} className="object-cover w-full h-full" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold" style={{ color: activeColor }}>
              {data.contact.firstName || 'YOUR'} {data.contact.lastName || 'NAME'}
            </h1>
            {data.contact.desiredJobTitle && (
              <p className="text-zinc-600 mt-1 text-[1.08em]">{data.contact.desiredJobTitle}</p>
            )}
            <div className="flex gap-4 mt-2 text-sm text-zinc-500">
              {data.contact.email && <span>{data.contact.email}</span>}
              {data.contact.phone && <span>{data.contact.phone}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Two column content */}
      <div className="grid grid-cols-5 gap-6 p-6">
        {/* Left column - 3 cols */}
        <div className="col-span-3 space-y-4">
          {/* Summary */}
          {data.summary && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Profile" layout="modern" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <p className="text-zinc-600">{data.summary}</p>
            </div>
          )}

          {/* Experience */}
          {data.experiences.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Experience" layout="modern" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
                {data.experiences.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-zinc-800">{exp.jobTitle || 'Job Title'}</p>
                        <p className="text-zinc-600">{exp.employer || 'Company'}</p>
                        {exp.location && <p className="text-zinc-500 text-[0.92em]">{exp.location}</p>}
                      </div>
                      <p className="text-zinc-500 text-[0.92em]">{formatDateRange(exp.startDate, exp.isCurrentJob ? 'Present' : exp.endDate)}</p>
                    </div>
                    {exp.description && renderRichDescription(exp.description, "text-zinc-600 mt-1 whitespace-pre-line")}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column - 2 cols */}
        <div className="col-span-2 space-y-4">
          {/* Education */}
          {data.educations.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Education" layout="modern" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
                {data.educations.map((edu) => (
                  <div key={edu.id}>
                    <p className="font-semibold text-zinc-800">{edu.degree || 'Degree'}</p>
                    <p className="text-zinc-600">{edu.schoolName}</p>
                    <p className="text-zinc-500 text-[0.92em]">{formatDateRange(edu.startDate, edu.endDate)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {data.skills.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Skills" layout="modern" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div className="flex flex-wrap gap-1">
                {data.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-2 py-0.5 text-sm rounded"
                    style={{ backgroundColor: `${activeColor}15`, color: activeColor }}
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {data.finalize.languages.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Languages" layout="modern" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div className="space-y-1">
                {data.finalize.languages.map((lang) => (
                  <p key={lang.id} className="text-zinc-600">
                    {lang.name}  -  <span className="text-zinc-500">{lang.proficiency}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {data.finalize.certifications.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Certifications" layout="modern" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {data.finalize.certifications.map((cert) => (
                  <p key={cert.id} className="text-zinc-600 text-sm">
                    {cert.name}{cert.issuer ? `  -  ${cert.issuer}` : ''}{cert.date ? ` (${cert.date})` : ''}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Websites/Links */}
          {data.finalize.websites.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Links" layout="modern" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div className="space-y-1">
                {data.finalize.websites.map((site) => (
                  <p key={site.id} className="text-zinc-600 text-sm">
                    {site.label}: <span style={{ color: activeColor }}>{site.url}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {renderFinalizeTailSections('modern')}
        </div>
      </div>
    </div>
  );

  // Sidebar Layout - Left sidebar with contact/skills, right content
  const renderSidebarLayout = () => (
    <div
      className="flex items-stretch bg-white"
      style={{ 
        fontSize: `${designOptions.fontSize}px`,
        lineHeight: designOptions.lineSpacing
      }}
    >
      <div
        className="self-stretch bg-[#374151] px-7 py-8 text-white"
        style={{
          width: `${SIDEBAR_WIDTH_MM}mm`,
          flex: `0 0 ${SIDEBAR_WIDTH_MM}mm`,
          maxWidth: `${SIDEBAR_WIDTH_MM}mm`,
        }}
      >
        {showPhoto && data.contact.photoUrl ? (
          <div className="mb-8 flex justify-center">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-white/30">
              <Image src={data.contact.photoUrl} alt="Profile" width={96} height={96} className="h-full w-full object-cover" />
            </div>
          </div>
        ) : null}

        <div className="space-y-6">
          <section>
            <h3 className="border-b border-white/35 pb-2 text-[1rem] font-bold text-white">Contact</h3>
            <div className="mt-3 space-y-4 text-[0.82rem]">
              {data.contact.phone && (
                <div>
                  <p className="font-semibold text-white">Phone</p>
                  <p className="text-white/80">{data.contact.phone}</p>
                </div>
              )}
              {data.contact.email && (
                <div>
                  <p className="font-semibold text-white">Email</p>
                  <p className="break-words text-white/80">{data.contact.email}</p>
                </div>
              )}
              {data.finalize.websites[0] && (
                <div>
                  <p className="font-semibold text-white">Website</p>
                  <p className="break-words text-white/80">{data.finalize.websites[0].url}</p>
                </div>
              )}
              <div>
                <p className="font-semibold text-white">Address</p>
                <p className="text-white/80">
                  {data.finalize.references[0]?.company || 'Your City, State'}
                </p>
              </div>
            </div>
          </section>

          {data.skills.length > 0 && (
            <section>
              <h3 className="border-b border-white/35 pb-2 text-[1rem] font-bold text-white">Expertise</h3>
              <div className="mt-3 space-y-2.5 text-[0.82rem] text-white/90">
                {data.skills.map((skill) => (
                  <p key={skill.id}>{skill.name}</p>
                ))}
              </div>
            </section>
          )}

          {data.finalize.languages.length > 0 && (
            <section>
              <h3 className="border-b border-white/35 pb-2 text-[1rem] font-bold text-white">Language</h3>
              <div className="mt-3 space-y-2.5 text-[0.82rem] text-white/90">
                {data.finalize.languages.map((lang) => (
                  <p key={lang.id}>{lang.name}</p>
                ))}
              </div>
            </section>
          )}

          {data.finalize.awards.length > 0 && (
            <section>
              <h3 className="border-b border-white/35 pb-2 text-[1rem] font-bold text-white">Awards</h3>
              <div className="mt-3 space-y-4 text-[0.72rem] leading-5 text-white/90">
                {data.finalize.awards.map((award) => (
                  <div key={award.id}>
                    {award.date && <p className="font-semibold text-white/75">{award.date}</p>}
                    <p className="font-semibold text-white">{award.title}</p>
                    {award.issuer && <p className="text-white/80">{award.issuer}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <div
        className="bg-white px-8 py-8"
        style={{
          width: `${A4_PAGE_WIDTH_MM - SIDEBAR_WIDTH_MM}mm`,
          flex: `0 0 ${A4_PAGE_WIDTH_MM - SIDEBAR_WIDTH_MM}mm`,
          maxWidth: `${A4_PAGE_WIDTH_MM - SIDEBAR_WIDTH_MM}mm`,
        }}
      >
        <div className="mb-8">
          <h1 className="text-[2.2rem] font-bold leading-none text-[#374151]">
            {data.contact.firstName || 'Your'} {data.contact.lastName || 'Name'}
          </h1>
          {data.contact.desiredJobTitle && (
            <p className="mt-2 text-[1.15rem] text-[#6b7280]">{data.contact.desiredJobTitle}</p>
          )}
        </div>

        {data.experiences.length > 0 && (
          <section style={{ marginBottom: `${designOptions.sectionSpacing + 10}px` }}>
            <h2 className="mb-4 border-b border-[#9ca3af] pb-1 text-[1.05rem] font-bold text-[#374151]">
              Experience
            </h2>
            <div className="space-y-5">
              {data.experiences.map((exp) => (
                <div key={exp.id} className="grid grid-cols-[128px_1fr] gap-4">
                  <div className="text-[0.82rem] text-[#6b7280]">
                    <p className="text-[0.92em]">{formatDateRange(exp.startDate, exp.isCurrentJob ? 'Present' : exp.endDate)}</p>
                    <p className="mt-1 text-[0.9rem]">{exp.employer || 'Company'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#374151]">{exp.jobTitle || 'Role'}</p>
                    {exp.description && renderRichDescription(exp.description, "mt-1 whitespace-pre-line text-[0.82rem] leading-5 text-[#6b7280]", "mt-1 list-disc space-y-1 pl-5 text-[0.82rem] leading-5 text-[#6b7280]")}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.educations.length > 0 && (
          <section style={{ marginBottom: `${designOptions.sectionSpacing + 8}px` }}>
            <h2 className="mb-4 border-b border-[#9ca3af] pb-1 text-[1.05rem] font-bold text-[#374151]">
              Education
            </h2>
            <div className="space-y-5">
              {data.educations.map((edu) => (
                <div key={edu.id} className="grid grid-cols-[128px_1fr] gap-4">
                  <div className="text-[0.82rem] text-[#6b7280]">
                    <p className="text-[0.92em]">{formatDateRange(edu.startDate, edu.endDate)}</p>
                    <p className="mt-1 text-[0.9rem]">{edu.schoolName || 'School'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#374151]">{edu.degree || 'Degree'}</p>
                    {edu.description && renderRichDescription(edu.description, "mt-1 text-[0.82rem] leading-5 text-[#6b7280]", "mt-1 list-disc space-y-1 pl-5 text-[0.82rem] leading-5 text-[#6b7280]")}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.finalize.references.length > 0 && (
          <section>
            <h2 className="mb-4 border-b border-[#9ca3af] pb-1 text-[1.05rem] font-bold text-[#374151]">
              References
            </h2>
            <div className="grid grid-cols-2 gap-8">
              {data.finalize.references.map((ref) => (
                <div key={ref.id}>
                  <p className="font-semibold text-[#374151]">{ref.name}</p>
                  <p className="text-[0.82rem] text-[#6b7280]">
                    {ref.company || ''}{ref.position ? `${ref.company ? ' / ' : ''}${ref.position}` : ''}
                  </p>
                  {ref.phone && <p className="mt-2 text-[0.76rem] text-[#4b5563]">Phone: {ref.phone}</p>}
                  {ref.email && <p className="text-[0.76rem] text-[#4b5563]">Email: {ref.email}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.experiences.length === 0 && data.educations.length === 0 && data.finalize.references.length === 0 && data.summary && (
          <section>
            <h2 className="mb-4 border-b border-[#9ca3af] pb-1 text-[1.05rem] font-bold text-[#374151]">
              Profile
            </h2>
            <p className="text-[0.88rem] leading-6 text-[#6b7280]">{data.summary}</p>
          </section>
        )}
      </div>
    </div>
  );
  // Bold Layout - Full header with color, strong sections
  const renderBoldLayout = () => (
    <div
      className="bg-white"
      style={{ 
        fontSize: `${designOptions.fontSize}px`,
        lineHeight: designOptions.lineSpacing
      }}
    >
      {/* Bold Header */}
      <div className="p-6 text-white" style={{ backgroundColor: activeColor }}>
        <div className="flex items-center gap-4">
          {showPhoto && data.contact.photoUrl && (
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 shrink-0">
              <Image src={data.contact.photoUrl} alt="Profile" width={96} height={96} className="object-cover w-full h-full" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-wide">
              {data.contact.firstName || 'YOUR'} {data.contact.lastName || 'NAME'}
            </h1>
            {data.contact.desiredJobTitle && (
              <p className="text-white/80 text-lg mt-1">{data.contact.desiredJobTitle}</p>
            )}
            <div className="flex gap-4 mt-3 text-sm text-white/70">
              {data.contact.email && <span>{data.contact.email}</span>}
              {data.contact.phone && <span>{data.contact.phone}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {renderOrderedSectionBlocks('bold', {
          summaryTitle: 'Profile',
        })}
      </div>
    </div>
  );

  // Minimal Layout - Clean, centered, simple
  const renderMinimalLayout = () => (
    <div
      className="p-8 bg-white"
      style={{ 
        fontSize: `${designOptions.fontSize}px`,
        lineHeight: designOptions.lineSpacing
      }}
    >
      {/* Centered Header */}
      <div className="text-center" style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
        {showPhoto && data.contact.photoUrl && (
          <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-zinc-200 mb-3">
            <Image src={data.contact.photoUrl} alt="Profile" width={80} height={80} className="object-cover w-full h-full" />
          </div>
        )}
        <h1 className="text-2xl font-semibold text-zinc-800">
          {data.contact.firstName || 'Your'} {data.contact.lastName || 'Name'}
        </h1>
        {data.contact.desiredJobTitle && (
          <p className="text-zinc-500 mt-1 text-[1.08em]">{data.contact.desiredJobTitle}</p>
        )}
        <div className="flex justify-center gap-4 mt-2 text-sm text-zinc-400">
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>{data.contact.phone}</span>}
        </div>
      </div>

      {renderOrderedSectionBlocks('minimal', {
        skillsAsList: true,
      })}
    </div>
  );

  // Executive Layout - Strong hierarchy, professional
  const renderExecutiveLayout = () => (
    <div
      className="p-8 bg-white"
      style={{ 
        fontSize: `${designOptions.fontSize}px`,
        lineHeight: designOptions.lineSpacing
      }}
    >
      {/* Header with border */}
      <div className="border-b-2 pb-4" style={{ borderColor: activeColor, marginBottom: `${designOptions.sectionSpacing}px` }}>
        <div className="flex items-center gap-4">
          {showPhoto && data.contact.photoUrl && (
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-200 shrink-0">
              <Image src={data.contact.photoUrl} alt="Profile" width={96} height={96} className="object-cover w-full h-full" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold" style={{ color: activeColor }}>
              {data.contact.firstName || 'YOUR'} {data.contact.lastName || 'NAME'}
            </h1>
            {data.contact.desiredJobTitle && (
              <p className="text-zinc-600 text-lg mt-1">{data.contact.desiredJobTitle}</p>
            )}
            <div className="flex gap-4 mt-2 text-sm text-zinc-500">
              {data.contact.email && <span>{data.contact.email}</span>}
              {data.contact.phone && <span>{data.contact.phone}</span>}
            </div>
          </div>
        </div>
      </div>

      {renderOrderedSectionBlocks('executive', {
        summaryNoHeader: true,
        experienceTitle: 'Professional Experience',
        skillsTitle: 'Core Competencies',
      })}
    </div>
  );

  // Classic Layout - Traditional resume format
  const renderClassicLayout = () => (
    <div
      className="p-8"
      style={{ 
        borderTop: `4px solid ${activeColor}`,
        fontSize: `${designOptions.fontSize}px`,
        lineHeight: designOptions.lineSpacing
      }}
    >
      {/* Header */}
      <div className="text-center" style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
        {showPhoto && data.contact.photoUrl && (
          <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-zinc-200 mb-3">
            <Image src={data.contact.photoUrl} alt="Profile" width={80} height={80} className="object-cover w-full h-full" />
          </div>
        )}
        <h1
          className="text-2xl font-bold uppercase tracking-wide"
          style={{ color: activeColor }}
        >
          {data.contact.firstName || 'YOUR'} {data.contact.lastName || 'NAME'}
        </h1>
        {data.contact.desiredJobTitle && (
          <p className="text-gray-600 mt-1 text-[1.08em]">{data.contact.desiredJobTitle}</p>
        )}
        <div className="flex justify-center gap-4 mt-2 text-gray-500">
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>{data.contact.phone}</span>}
        </div>
      </div>

      {renderOrderedSectionBlocks('classic')}
    </div>
  );

  const renderOrbitLayout = () => (
    <div
      className="h-full bg-white"
      style={{
        fontSize: `${designOptions.fontSize}px`,
        lineHeight: designOptions.lineSpacing,
        minHeight: `${totalDocumentHeightMm}mm`,
        height: '100%'
      }}
    >
      <div
        className="grid items-start grid-cols-[30%_70%]"
        style={{ minHeight: `${totalDocumentHeightMm}mm`, height: '100%' }}
      >
        <aside
          className="relative flex flex-col overflow-hidden bg-[#f3f3f3] text-white"
          style={{ minHeight: `${totalDocumentHeightMm}mm`, height: '100%' }}
        >
          <div className="px-7 py-10 text-[#4b5563]">
            <div className="space-y-3 text-[0.84rem]">
              {data.contact.phone && <p>{data.contact.phone}</p>}
              {data.contact.email && <p className="break-words">{data.contact.email}</p>}
              {data.finalize.websites[0] && <p className="break-words">{data.finalize.websites[0].url}</p>}
              <p>{data.finalize.references[0]?.company || '123 Anywhere St, Any City'}</p>
            </div>
          </div>

          <div
            className="-mt-4 flex-1 rounded-t-[999px] bg-[#3f3f42] px-4 py-5"
            style={{ minHeight: 0 }}
          >
            {shouldRenderPhoto ? (
              <div className="mx-auto mb-5 flex h-48 w-48 items-center justify-center rounded-full bg-[#4a4a4d]">
                <div className="h-40 w-40 overflow-hidden rounded-full border-[3px] border-white/95 bg-white/20">
                  {data.contact.photoUrl ? (
                    <Image src={data.contact.photoUrl} alt="Profile" width={160} height={160} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#5a5a5f] text-[2.1rem] font-bold text-white/85">
                      {(data.contact.firstName?.[0] || "Y").toUpperCase()}
                      {(data.contact.lastName?.[0] || "N").toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {data.summary && (
              <section className="mb-7">
                <h3 className="border-b border-white/15 pb-2 text-[1.05rem] font-extrabold uppercase tracking-[0.04em] text-white">
                  About Me
                </h3>
                <p className="mt-3 text-[0.83rem] font-semibold leading-5 text-white/92">{data.summary}</p>
              </section>
            )}

            {data.skills.length > 0 && (
              <section className="mb-7">
                <h3 className="border-b border-white/15 pb-2 text-[1.05rem] font-extrabold uppercase tracking-[0.04em] text-white">
                  Skills
                </h3>
                <ul className="mt-3 space-y-1.5 text-[0.82rem] text-white/90">
                  {data.skills.map((skill) => (
                    <li key={skill.id} className="flex gap-2">
                      <span className="mt-[0.42rem] h-[4px] w-[4px] shrink-0 rounded-full bg-white/80" />
                      <span>{skill.name}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.finalize.languages.length > 0 && (
              <section>
                <h3 className="border-b border-white/15 pb-2 text-[1.05rem] font-extrabold uppercase tracking-[0.04em] text-white">
                  Language
                </h3>
                <ul className="mt-3 space-y-1.5 text-[0.82rem] text-white/90">
                  {data.finalize.languages.map((lang) => (
                    <li key={lang.id} className="flex gap-2">
                      <span className="mt-[0.42rem] h-[4px] w-[4px] shrink-0 rounded-full bg-white/80" />
                      <span>{lang.name}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </aside>

        <main data-orbit-main className="self-start px-8 py-9">
          <div className="mb-8">
            <h1 className="text-[3rem] font-black uppercase leading-[0.95] tracking-tight text-black">
              {data.contact.firstName || 'Your'}
              <br />
              {data.contact.lastName || 'Name'}
            </h1>
            {data.contact.desiredJobTitle && (
              <p className="mt-3 text-[1.2rem] text-[#4b5563]">{data.contact.desiredJobTitle}</p>
            )}
          </div>

          {data.experiences.length > 0 && (
            <section style={{ marginBottom: `${designOptions.sectionSpacing + 10}px` }}>
              <h2 className="mb-4 border-b border-[#d1d5db] pb-2 text-[1.05rem] font-extrabold uppercase tracking-[0.04em] text-black">
                Experience
              </h2>
              <div className="space-y-6">
                {data.experiences.map((exp) => (
                  <div key={exp.id} className="grid grid-cols-[84px_1fr] gap-5">
                    <div className="text-[0.84rem] leading-5 text-[#374151]">
                      <p className="whitespace-nowrap">{exp.startDate || '2021'}</p>
                      <p className="whitespace-nowrap">{exp.isCurrentJob ? 'Present' : (exp.endDate || '2022')}</p>
                    </div>
                    <div>
                      <p className="text-[1rem] font-bold text-black">{exp.jobTitle || 'Sales Representative'}</p>
                      <p className="mt-0.5 text-[0.88rem] text-[#4b5563]">{exp.employer || 'Company'}</p>
                      {exp.description && renderRichDescription(exp.description, "mt-2 whitespace-pre-line text-[0.8rem] leading-5 text-[#374151]", "mt-2 list-disc space-y-1 pl-5 text-[0.8rem] leading-5 text-[#374151]")}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.educations.length > 0 && (
            <section style={{ marginBottom: `${designOptions.sectionSpacing + 8}px` }}>
              <h2 className="mb-4 border-b border-[#d1d5db] pb-2 text-[1.05rem] font-extrabold uppercase tracking-[0.04em] text-black">
                Education
              </h2>
              <div className="grid grid-cols-2 gap-8">
                {data.educations.map((edu) => (
                  <div key={edu.id}>
                    <p className="text-[1rem] font-bold text-black">{edu.degree || 'Degree'}</p>
                    <p className="mt-0.5 text-[0.88rem] text-[#4b5563]">{edu.schoolName || 'School'}</p>
                    <p className="text-[0.8rem] text-[#4b5563]">{edu.startDate || '2012'}-{edu.endDate || '2016'}</p>
                    {edu.location && <p className="text-[0.8rem] text-[#4b5563]">{edu.location}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.finalize.references.length > 0 && (
            <section>
              <h2 className="mb-4 border-b border-[#d1d5db] pb-2 text-[1.05rem] font-extrabold uppercase tracking-[0.04em] text-black">
                Reference
              </h2>
              <div className="grid grid-cols-2 gap-8">
                {data.finalize.references.map((ref) => (
                  <div key={ref.id}>
                    <p className="font-semibold text-black">{ref.name}</p>
                    <p className="text-[0.84rem] text-[#4b5563]">
                      {ref.position || ''}{ref.company ? `${ref.position ? ' | ' : ''}${ref.company}` : ''}
                    </p>
                    {ref.company && <p className="mt-1 text-[0.84rem] text-[#4b5563]">{ref.company}</p>}
                    {ref.phone && <p className="mt-2 text-[0.84rem] text-[#374151]">{ref.phone}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
  const renderStellarLayout = () => (
    <div
      className="bg-white"
      style={{
        fontSize: `${designOptions.fontSize}px`,
        lineHeight: designOptions.lineSpacing
      }}
    >
      <div className="px-8 pt-8 pb-5 border-b" style={{ borderColor: `${activeColor}35` }}>
        <div className="mt-2 flex items-center gap-3">
          {showPhoto && data.contact.photoUrl && (
            <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-zinc-200 shrink-0">
              <Image src={data.contact.photoUrl} alt="Profile" width={64} height={64} className="object-cover w-full h-full" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">
              {data.contact.firstName || 'Your'} {data.contact.lastName || 'Name'}
            </h1>
            {data.contact.desiredJobTitle && <p className="text-zinc-600 mt-1 text-[1.08em]">{data.contact.desiredJobTitle}</p>}
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-zinc-500">
              {data.contact.email && <span>{data.contact.email}</span>}
              {data.contact.phone && <span>{data.contact.phone}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5">
        <aside className="col-span-2 p-6 border-r bg-zinc-50/80" style={{ borderColor: `${activeColor}25` }}>
          {data.summary && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="About" layout="classic" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <p className="text-zinc-600">{data.summary}</p>
            </div>
          )}

          {data.skills.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Top Skills" layout="classic" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div className="space-y-1">
                {data.skills.map((skill) => (
                  <p key={skill.id} className="text-zinc-700">
                    {skill.name}
                  </p>
                ))}
              </div>
            </div>
          )}
        </aside>

        <section className="col-span-3 p-6">
          {data.experiences.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Experience" layout="classic" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
                {data.experiences.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="font-semibold text-zinc-900">{exp.jobTitle || 'Role'}</p>
                        <p className="text-zinc-600">{exp.employer || 'Company'}</p>
                        {exp.location && <p className="text-zinc-500 text-[0.92em]">{exp.location}</p>}
                      </div>
                      <p className="text-zinc-500 text-[0.92em]">{formatDateRange(exp.startDate, exp.isCurrentJob ? 'Present' : exp.endDate)}</p>
                    </div>
                    {exp.description && renderRichDescription(exp.description, "text-zinc-600 mt-1 whitespace-pre-line")}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.educations.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Education" layout="classic" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
                {data.educations.map((edu) => (
                  <div key={edu.id}>
                    <p className="font-semibold text-zinc-900">{edu.degree || 'Degree'}</p>
                    <p className="text-zinc-600">{edu.schoolName || 'School'}</p>
                    <p className="text-zinc-500 text-[0.92em]">{formatDateRange(edu.startDate, edu.endDate)}</p>
                    {edu.description && renderRichDescription(edu.description, "text-zinc-600 mt-1 text-[1.08em]")}
                  </div>
                ))}
              </div>
            </div>
          )}

          {renderAdditionalSections('classic')}
        </section>
      </div>
    </div>
  );

  const renderAuroraLayout = () => (
    <div
      className="bg-white"
      style={{
        fontSize: `${designOptions.fontSize}px`,
        lineHeight: designOptions.lineSpacing
      }}
    >
      <div className="border-b p-6 pb-5" style={{ borderColor: `${activeColor}35` }}>
        <div className="flex items-start justify-between gap-4">
          {showPhoto && data.contact.photoUrl && (
            <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-zinc-200 shrink-0">
              <Image src={data.contact.photoUrl} alt="Profile" width={64} height={64} className="object-cover w-full h-full" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-zinc-900">
              {data.contact.firstName || 'Your'} {data.contact.lastName || 'Name'}
            </h1>
            {data.contact.desiredJobTitle && <p className="text-zinc-600 mt-1 text-[1.08em]">{data.contact.desiredJobTitle}</p>}
          </div>
          <div className="min-w-[180px] border-l pl-4 text-sm text-zinc-500" style={{ borderColor: `${activeColor}25` }}>
            <p className="font-semibold uppercase tracking-[0.22em]" style={{ color: activeColor }}>Contact</p>
            <div className="mt-2 space-y-1">
               {data.contact.email && <span>{data.contact.email}</span>}
              {data.contact.email && data.contact.phone && <span className="mx-1 text-zinc-300">|</span>}
              {data.contact.phone && <span>{data.contact.phone}</span>}
              {data.finalize.websites[0] && (
                <p className="break-words">{data.finalize.websites[0].label}: {data.finalize.websites[0].url}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5">
        <div className="col-span-3 p-6">
          {data.summary && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Summary" layout="sidebar" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <p className="text-zinc-600">{data.summary}</p>
            </div>
          )}

          {data.experiences.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Experience" layout="sidebar" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
                {data.experiences.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="font-semibold text-zinc-900">{exp.jobTitle || 'Role'}</p>
                        <p className="text-zinc-600">{exp.employer || 'Company'}</p>
                        {exp.location && <p className="text-zinc-500 text-[0.92em]">{exp.location}</p>}
                      </div>
                      <p className="text-zinc-500 text-[0.92em]">{formatDateRange(exp.startDate, exp.isCurrentJob ? 'Present' : exp.endDate)}</p>
                    </div>
                    {exp.description && renderRichDescription(exp.description, "text-zinc-600 mt-1 whitespace-pre-line")}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.educations.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Education" layout="sidebar" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
                {data.educations.map((edu) => (
                  <div key={edu.id}>
                    <p className="font-semibold text-zinc-900">{edu.degree || 'Degree'}</p>
                    <p className="text-zinc-600">{edu.schoolName || 'School'}</p>
                    <p className="text-zinc-500 text-[0.92em]">{formatDateRange(edu.startDate, edu.endDate)}</p>
                    {edu.description && renderRichDescription(edu.description, "text-zinc-600 mt-1 text-[1.08em]")}
                  </div>
                ))}
              </div>
            </div>
          )}

          {renderFinalizeTailSections('sidebar')}
        </div>

        <aside className="col-span-2 border-l p-6 space-y-4" style={{ borderColor: `${activeColor}25`, backgroundColor: `${activeColor}06` }}>

          {data.skills.length > 0 && (
            <div>
              <p className="font-bold uppercase tracking-wide text-sm mb-2" style={{ color: activeColor }}>
                Core Skills
              </p>
              <div className="flex flex-wrap gap-1">
                {data.skills.map((skill) => (
                  <span key={skill.id} className="px-2 py-1 rounded text-sm bg-white/70 text-zinc-700">
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.finalize.languages.length > 0 && (
            <div>
              <p className="font-bold uppercase tracking-wide text-sm mb-2" style={{ color: activeColor }}>
                Languages
              </p>
              <div className="space-y-1 text-zinc-700">
                {data.finalize.languages.map((lang) => (
                  <p key={lang.id}>
                    {lang.name} - {lang.proficiency}
                  </p>
                ))}
              </div>
            </div>
          )}

          {data.finalize.certifications.length > 0 && (
            <div>
              <p className="font-bold uppercase tracking-wide text-sm mb-2" style={{ color: activeColor }}>
                Certifications
              </p>
              <div className="space-y-1 text-zinc-700">
                {data.finalize.certifications.map((cert) => (
                  <p key={cert.id}>
                    {cert.name} - {cert.issuer}
                  </p>
                ))}
              </div>
            </div>
          )}

          {data.finalize.websites.length > 0 && (
            <div>
              <p className="font-bold uppercase tracking-wide text-sm mb-2" style={{ color: activeColor }}>
                Links
              </p>
              <div className="space-y-1">
                {data.finalize.websites.map((site) => (
                  <p key={site.id} className="text-zinc-700 break-words">
                    {site.label}: {site.url}
                  </p>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );

  const renderZenithLayout = () => (
    <div
      className="p-8 bg-white"
      style={{
        fontSize: `${designOptions.fontSize}px`,
        lineHeight: designOptions.lineSpacing
      }}
    >
      <div className="border-b pb-4" style={{ borderColor: `${activeColor}50`, marginBottom: `${designOptions.sectionSpacing}px` }}>
        {showPhoto && data.contact.photoUrl && (
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-zinc-200 mb-3">
            <Image src={data.contact.photoUrl} alt="Profile" width={80} height={80} className="object-cover w-full h-full" />
          </div>
        )}
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">
              {data.contact.firstName || 'Your'} {data.contact.lastName || 'Name'}
            </h1>
            {data.contact.desiredJobTitle && (
              <p className="text-zinc-600 mt-1 text-[1.08em]">{data.contact.desiredJobTitle}</p>
            )}
          </div>
          <div className="text-right text-sm text-zinc-500">
            {data.contact.email && <p>{data.contact.email}</p>}
            {data.contact.phone && <p>{data.contact.phone}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm" style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
        <div className="rounded border px-4 py-3" style={{ borderColor: `${activeColor}45` }}>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Experience</p>
          <p className="mt-1 font-semibold text-zinc-900">{Math.max(1, data.experiences.length)} roles documented</p>
        </div>
        <div className="rounded border px-4 py-3" style={{ borderColor: `${activeColor}45` }}>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Skills</p>
          <p className="mt-1 font-semibold text-zinc-900">{Math.max(1, data.skills.length)} competencies listed</p>
        </div>
        <div className="rounded border px-4 py-3" style={{ borderColor: `${activeColor}45` }}>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Education</p>
          <p className="mt-1 font-semibold text-zinc-900">{Math.max(1, data.educations.length)} credentials included</p>
        </div>
      </div>

      {renderOrderedSectionBlocks('executive', {
        summaryTitle: 'Executive Summary',
        experienceTitle: 'Professional Experience',
        skillsTitle: 'Core Competencies',
      })}
    </div>
  );

  const renderPulseLayout = () => (
    <div
      className="bg-white"
      style={{
        fontSize: `${designOptions.fontSize}px`,
        lineHeight: designOptions.lineSpacing
      }}
    >
      <div className="border-b p-6" style={{ borderColor: `${activeColor}30`, backgroundColor: `${activeColor}08` }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">
              {data.contact.firstName || 'Your'} {data.contact.lastName || 'Name'}
            </h1>
            {data.contact.desiredJobTitle && (
              <p className="mt-1 text-zinc-600 text-[1.08em]">{data.contact.desiredJobTitle}</p>
            )}
          </div>
          <div className="text-right text-sm text-zinc-500">
            {data.contact.email && <p>{data.contact.email}</p>}
            {data.contact.phone && <p>{data.contact.phone}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6 p-6">
        <div className="col-span-3">
          {data.summary && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Summary" layout="modern" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <p className="text-zinc-600">{data.summary}</p>
            </div>
          )}

          {data.experiences.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Experience" layout="modern" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
                {data.experiences.map((exp) => (
                  <div key={exp.id} className="rounded border-l-4 bg-white p-3" style={{ borderColor: `${activeColor}45`, boxShadow: `inset 0 0 0 1px ${activeColor}15` }}>
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="font-semibold text-zinc-900">{exp.jobTitle || 'Role'}</p>
                        <p className="text-zinc-600">{exp.employer || 'Company'}</p>
                        {exp.location && <p className="text-zinc-500 text-[0.92em]">{exp.location}</p>}
                      </div>
                      <p className="text-zinc-500 text-[0.92em]">{formatDateRange(exp.startDate, exp.isCurrentJob ? 'Present' : exp.endDate)}</p>
                    </div>
                    {exp.description && renderRichDescription(exp.description, "text-zinc-600 mt-2 whitespace-pre-line")}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-2 space-y-4">
          {data.educations.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Education" layout="modern" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
                {data.educations.map((edu) => (
                  <div key={edu.id}>
                    <p className="font-semibold text-zinc-900">{edu.degree || 'Degree'}</p>
                    <p className="text-zinc-600">{edu.schoolName || 'School'}</p>
                    <p className="text-zinc-500 text-[0.92em]">{formatDateRange(edu.startDate, edu.endDate)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.skills.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Skills" layout="modern" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div className="flex flex-wrap gap-1">
                {data.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-2 py-1 rounded-sm text-sm border"
                    style={{ backgroundColor: `${activeColor}10`, color: activeColor, borderColor: `${activeColor}20` }}
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {renderAdditionalSections('modern')}
        </div>
      </div>
    </div>
  );

  const renderClassicTemplateLayout = () => (
    <div
      className="p-8 bg-white"
      style={{
        fontSize: `${designOptions.fontSize}px`,
        lineHeight: designOptions.lineSpacing
      }}
    >
      <div className="border-b-2 border-zinc-900 pb-3" style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
        <div className="flex items-center gap-3">
          {showPhoto && data.contact.photoUrl && (
            <div className="w-16 h-16 rounded-full overflow-hidden border border-zinc-300 shrink-0">
              <Image src={data.contact.photoUrl} alt="Profile" width={64} height={64} className="object-cover w-full h-full" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">
              {data.contact.firstName || 'Your'} {data.contact.lastName || 'Name'}
            </h1>
            {data.contact.desiredJobTitle && (
              <p className="text-zinc-600 mt-1 text-[1.08em]">{data.contact.desiredJobTitle}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-2 text-sm text-zinc-500">
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>{data.contact.phone}</span>}
        </div>
      </div>

      {renderOrderedSectionBlocks('harvard', {
        skillsAsList: true,
      })}
    </div>
  );

  const renderMetroLayout = () => (
    <div
      className="bg-white"
      style={{
        fontSize: `${designOptions.fontSize}px`,
        lineHeight: designOptions.lineSpacing
      }}
    >
      <div className="grid grid-cols-6">
        <aside className="col-span-2 p-6 text-white" style={{ backgroundColor: activeColor }}>
          {showPhoto && data.contact.photoUrl && (
            <div className="w-20 h-20 rounded-md overflow-hidden bg-white/20 mb-4">
              <Image src={data.contact.photoUrl} alt="Profile" width={80} height={80} className="object-cover w-full h-full" />
            </div>
          )}
          <h1 className="text-2xl font-bold leading-tight">
            {data.contact.firstName || 'Your'} {data.contact.lastName || 'Name'}
          </h1>
          {data.contact.desiredJobTitle && <p className="text-white/80 mt-2 text-[1.08em]">{data.contact.desiredJobTitle}</p>}

          <div className="mt-5 space-y-1 text-sm text-white/85">
            {data.contact.email && <p>{data.contact.email}</p>}
            {data.contact.phone && <p>{data.contact.phone}</p>}
          </div>

          {data.skills.length > 0 && (
            <div className="mt-6">
              <p className="font-bold uppercase tracking-wide text-sm border-b border-white/30 pb-1 mb-2">
                Skills
              </p>
              <div className="space-y-1">
                {data.skills.map((skill) => (
                  <p key={skill.id} className="text-white/90">
                    {skill.name}
                  </p>
                ))}
              </div>
            </div>
          )}
        </aside>

        <section className="col-span-4 p-6">
          {data.summary && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Summary" layout="minimal" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <p className="text-zinc-600">{data.summary}</p>
            </div>
          )}

          {data.experiences.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Experience" layout="minimal" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
                {data.experiences.map((exp) => (
                  <div key={exp.id} className="border-l-2 pl-4" style={{ borderColor: `${activeColor}55` }}>
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="font-semibold text-zinc-900">{exp.jobTitle || 'Role'}</p>
                        <p className="text-zinc-600">{exp.employer || 'Company'}</p>
                        {exp.location && <p className="text-zinc-500 text-[0.92em]">{exp.location}</p>}
                      </div>
                      <p className="text-zinc-500 text-[0.92em]">{formatDateRange(exp.startDate, exp.isCurrentJob ? 'Present' : exp.endDate)}</p>
                    </div>
                    {exp.description && renderRichDescription(exp.description, "text-zinc-600 mt-1 whitespace-pre-line")}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.educations.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Education" layout="minimal" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
                {data.educations.map((edu) => (
                  <div key={edu.id}>
                    <p className="font-semibold text-zinc-900">{edu.degree || 'Degree'}</p>
                    <p className="text-zinc-600">{edu.schoolName || 'School'}</p>
                    <p className="text-zinc-500 text-[0.92em]">{formatDateRange(edu.startDate, edu.endDate)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {renderAdditionalSections('minimal')}
        </section>
      </div>
    </div>
  );

  const renderBoldTemplateLayout = () => (
    <div
      className="bg-white"
      style={{
        fontSize: `${designOptions.fontSize}px`,
        lineHeight: designOptions.lineSpacing
      }}
    >
      <div className="border-t-[10px] bg-white" style={{ borderColor: activeColor }}>
        <div className="p-6 pb-4">
          <div className="flex items-end justify-between gap-4 border-b pb-4" style={{ borderColor: `${activeColor}30` }}>
            <div>
              <h1 className="text-3xl font-bold leading-tight text-zinc-900">
                {data.contact.firstName || 'Your'} {data.contact.lastName || 'Name'}
              </h1>
              {data.contact.desiredJobTitle && (
                <p className="text-zinc-600 mt-2 text-[1.08em]">{data.contact.desiredJobTitle}</p>
              )}
            </div>
            <div className="text-right text-sm text-zinc-500">
              {data.contact.email && <p>{data.contact.email}</p>}
              {data.contact.phone && <p>{data.contact.phone}</p>}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-5">
        <aside className="col-span-2 p-6" style={{ backgroundColor: `${activeColor}08` }}>
          <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: activeColor }}>
            Profile Snapshot
          </h2>
          {data.summary && <p className="mt-3 text-zinc-700">{data.summary}</p>}
          <h3 className="mt-6 text-sm font-bold uppercase tracking-wide" style={{ color: activeColor }}>
            Skills
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.skills.map((skill) => (
              <span
                key={skill.id}
                className="px-2 py-1 rounded-sm text-sm border bg-white"
                style={{ borderColor: `${activeColor}35`, color: activeColor }}
              >
                {skill.name}
              </span>
            ))}
          </div>
          {data.finalize.languages.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-bold uppercase tracking-wide" style={{ color: activeColor }}>
                Languages
              </h3>
              <div className="mt-2 space-y-1 text-zinc-700">
                {data.finalize.languages.map((lang) => (
                  <p key={lang.id}>{lang.name} - {lang.proficiency}</p>
                ))}
              </div>
            </>
          )}
        </aside>

        <main className="col-span-3 p-6 pt-2">
          {data.experiences.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Experience" layout="bold" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
                {data.experiences.map((exp) => (
                  <div key={exp.id} className="border-b pb-3" style={{ borderColor: `${activeColor}20` }}>
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="font-semibold text-zinc-900">{exp.jobTitle || 'Role'}</p>
                        <p style={{ color: activeColor }}>{exp.employer || 'Company'}</p>
                        {exp.location && <p className="text-zinc-500 text-[0.92em]">{exp.location}</p>}
                      </div>
                      <p className="text-zinc-500 text-[0.92em]">{formatDateRange(exp.startDate, exp.isCurrentJob ? 'Present' : exp.endDate)}</p>
                    </div>
                    {exp.description && renderRichDescription(exp.description, "text-zinc-600 mt-1 whitespace-pre-line")}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.educations.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Education" layout="bold" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
                {data.educations.map((edu) => (
                  <div key={edu.id} className="border-b pb-3" style={{ borderColor: `${activeColor}20` }}>
                    <p className="font-semibold text-zinc-900">{edu.degree || 'Degree'}</p>
                    <p style={{ color: activeColor }}>{edu.schoolName || 'School'}</p>
                    <p className="text-zinc-500 text-[0.92em]">{formatDateRange(edu.startDate, edu.endDate)}</p>
                    {edu.description && renderRichDescription(edu.description, "text-zinc-600 mt-1 text-[1.08em]")}
                  </div>
                ))}
              </div>
            </div>
          )}

          {renderAdditionalSections('bold')}
        </main>
        </div>
      </div>
    </div>
  );

  const renderBoardroomLayout = () => (
    <div
      className="bg-[#fbfbfa] px-8 py-7 text-[#4b5563]"
      style={{
        fontSize: `${designOptions.fontSize}px`,
        lineHeight: designOptions.lineSpacing
      }}
    >
      <div className="flex items-start justify-between gap-8 border-b border-[#b8b8b8] pb-5">
        <div className="flex-1 pt-3">
          <h1 className="text-[2.1rem] font-bold uppercase tracking-[0.12em] text-[#5b6168]">
            {data.contact.firstName || 'Your'} {data.contact.lastName || 'Name'}
          </h1>
          {data.contact.desiredJobTitle && (
            <p className="mt-1 text-[1.1rem] tracking-[0.18em] text-[#6b7280]">
              {data.contact.desiredJobTitle}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2 text-[0.85rem] text-[#6b7280]">
            {data.contact.phone && <span>{data.contact.phone}</span>}
            {data.contact.phone && (data.contact.email || data.finalize.websites[0]) && <span>|</span>}
            {data.contact.email && <span>{data.contact.email}</span>}
            {data.contact.email && data.finalize.websites[0] && <span>|</span>}
            {data.finalize.websites[0] && <span>{data.finalize.websites[0].url}</span>}
          </div>
        </div>

        {(showPhoto && data.contact.photoUrl) ? (
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full bg-[#d4d4d4]">
            <Image src={data.contact.photoUrl} alt="Profile" width={112} height={112} className="h-full w-full object-cover grayscale" />
          </div>
        ) : null}
      </div>

      <div className="mt-8 grid grid-cols-[1.7fr_0.95fr] gap-10">
        <div>
          {data.summary && (
            <section style={{ marginBottom: `${designOptions.sectionSpacing + 4}px` }}>
              <h2 className="mb-4 text-[1.05rem] font-bold uppercase tracking-[0.22em] text-[#5c6269]">
                Summary
              </h2>
              <p className="max-w-[97%] text-[0.9rem] leading-[1.75] text-[#5f6670]">
                {data.summary}
              </p>
            </section>
          )}

          {data.experiences.length > 0 && (
            <section style={{ marginBottom: `${designOptions.sectionSpacing + 8}px` }}>
              <h2 className="mb-5 text-[1.05rem] font-bold uppercase tracking-[0.22em] text-[#5c6269]">
                Experience
              </h2>
              <div className="relative pl-8">
                <div className="absolute bottom-2 left-[7px] top-2 w-px bg-[#a7a7a7]" />
                <div className="space-y-6">
                  {data.experiences.map((exp) => (
                    <div key={exp.id} className="relative">
                      <span className="absolute -left-[29px] top-[0.62rem] h-[9px] w-[9px] rounded-full border border-[#8d8d8d] bg-[#fbfbfa]" />
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-[#565d66]">{exp.jobTitle || 'Role'}</p>
                          <p className="mt-0.5 text-[0.9rem] text-[#7a8087]">{exp.employer || 'Company'}</p>
                        </div>
                        <p className="whitespace-nowrap text-[0.8rem] italic text-[#7a8087]">
                          {formatDateRange(exp.startDate, exp.isCurrentJob ? 'Present' : exp.endDate)}
                        </p>
                      </div>
                      {exp.description && renderRichDescription(exp.description, "mt-2 whitespace-pre-line text-[0.87rem] leading-[1.7] text-[#6b7280]", "mt-2 list-disc space-y-1.5 pl-5 text-[0.87rem] leading-[1.7] text-[#6b7280]")}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-8">
          {data.educations.length > 0 && (
            <section>
              <h2 className="mb-4 text-[1.05rem] font-bold uppercase tracking-[0.22em] text-[#5c6269]">
                Education
              </h2>
              <div className="space-y-4">
                {data.educations.map((edu) => (
                  <div key={edu.id}>
                    <p className="font-bold text-[#565d66]">{edu.schoolName || 'School'}</p>
                    <p className="text-[0.88rem] text-[#7a8087]">{edu.degree || 'Degree'}</p>
                    <p className="text-[0.92em] text-[#8a8f96]">{formatDateRange(edu.startDate, edu.endDate)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.skills.length > 0 && (
            <section>
              <h2 className="mb-4 text-[1.05rem] font-bold uppercase tracking-[0.22em] text-[#5c6269]">
                Skills
              </h2>
              <ul className="space-y-2 text-[0.88rem] text-[#6b7280]">
                {data.skills.map((skill) => (
                  <li key={skill.id} className="flex items-start gap-2">
                    <span className="mt-[0.45rem] h-[4px] w-[4px] rounded-full bg-[#7c8187]" />
                    <span>{skill.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.finalize.languages.length > 0 && (
            <section>
              <h2 className="mb-4 text-[1.05rem] font-bold uppercase tracking-[0.22em] text-[#5c6269]">
                Language
              </h2>
              <ul className="space-y-2 text-[0.88rem] text-[#6b7280]">
                {data.finalize.languages.map((lang) => (
                  <li key={lang.id} className="flex items-start gap-2">
                    <span className="mt-[0.45rem] h-[4px] w-[4px] rounded-full bg-[#7c8187]" />
                    <span>
                      {lang.name}
                      {lang.proficiency ? ` (${lang.proficiency.toLowerCase()})` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.finalize.certifications.length > 0 && (
            <section>
              <h2 className="mb-4 text-[1.05rem] font-bold uppercase tracking-[0.22em] text-[#5c6269]">
                Certifications
              </h2>
              <div className="space-y-3 text-[0.88rem] text-[#6b7280]">
                {data.finalize.certifications.map((cert) => (
                  <div key={cert.id}>
                    <p className="font-semibold text-[#565d66]">{cert.name}</p>
                    <p>{cert.issuer}{cert.date ? ` • ${cert.date}` : ''}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {data.finalize.references.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-5 text-[1.05rem] font-bold uppercase tracking-[0.22em] text-[#5c6269]">
            References
          </h2>
          <div className="grid grid-cols-2 gap-8">
            {data.finalize.references.map((ref) => (
              <div key={ref.id}>
                <p className="font-bold text-[#565d66]">{ref.name}</p>
                <p className="text-[0.88rem] text-[#6b7280]">
                  {ref.company || ''}{ref.position ? `${ref.company ? ' / ' : ''}${ref.position}` : ''}
                </p>
                {ref.phone && <p className="mt-3 text-[0.76rem] font-semibold text-[#6b7280]">Phone: <span className="font-normal">{ref.phone}</span></p>}
                {ref.email && <p className="text-[0.76rem] font-semibold text-[#6b7280]">Email: <span className="font-normal">{ref.email}</span></p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  // Helper function to render additional sections (languages, certifications, etc.)
  const renderAdditionalSections = (layoutType: TemplateLayout) => (
    <>
      {/* Languages */}
      {data.finalize.languages.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Languages" layout={layoutType} color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div className="flex flex-wrap gap-3">
            {data.finalize.languages.map((lang) => (
              <span key={lang.id}>
                {lang.name} ({lang.proficiency})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {data.finalize.certifications.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Certifications" layout={layoutType} color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {data.finalize.certifications.map((cert) => (
              <p key={cert.id}>
                {cert.name}{cert.issuer ? `  -  ${cert.issuer}` : ''}{cert.date ? ` (${cert.date})` : ''}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Websites/Links */}
      {data.finalize.websites.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Links" layout={layoutType} color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div className="flex flex-wrap gap-4">
            {data.finalize.websites.map((site) => (
              <span key={site.id} className="text-blue-600">
                {site.label}: {site.url}
              </span>
            ))}
          </div>
        </div>
      )}

      {renderFinalizeTailSections(layoutType)}
    </>
  );

  // Helper function to render awards, references, hobbies, and custom sections
  const renderFinalizeTailSections = (layoutType: TemplateLayout) => (
    <>
      {/* Awards & Honors */}
      {data.finalize.awards.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Awards & Honors" layout={layoutType} color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {data.finalize.awards.map((award) => (
              <p key={award.id}>
                {award.title}  -  {award.issuer} ({award.date})
              </p>
            ))}
          </div>
        </div>
      )}

      {/* References */}
      {data.finalize.references.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="References" layout={layoutType} color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
            {data.finalize.references.map((ref) => (
              <div key={ref.id}>
                <p className="font-semibold">{ref.name}</p>
                <p className="text-gray-600">
                  {ref.position}{ref.company ? `, ${ref.company}` : ''}
                </p>
                <p className="text-gray-500">
                  {ref.email} {ref.phone && `| ${ref.phone}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hobbies & Interests */}
      {data.finalize.hobbies.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Hobbies & Interests" layout={layoutType} color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div className="flex flex-wrap gap-2">
            {data.finalize.hobbies.map((hobby) => (
              <span key={hobby.id} className="bg-gray-100 px-2 py-1 rounded">
                {hobby.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Custom Sections */}
      {data.finalize.customSections.map((section) => (
        <div key={section.id} style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title={section.sectionName} layout={layoutType} color={activeColor} spacing={designOptions.paragraphSpacing} />
          <p className="text-gray-600">{section.description}</p>
        </div>
      ))}
    </>
  );
  return (
    <div 
      data-resume-preview 
      data-render-all-pages={renderAllPages ? 'true' : 'false'}
      className={cn(
        'overflow-hidden flex flex-col',
        plain ? 'rounded-none shadow-none' : 'shadow-xl rounded-lg',
        className
      )} 
      style={{ 
        fontFamily: designOptions.fontFamily,
        backgroundColor: pageBackgroundColor,
        // Set A4 width for preview (210mm)
        width: renderAllPages ? 'auto' : '210mm',
        maxWidth: renderAllPages ? 'none' : '210mm',
        // Don't constrain height in preview - let pages stack naturally
        height: renderAllPages ? 'auto' : 'auto',
        minHeight: renderAllPages ? 'auto' : undefined
      }}
    >
      {/* Resume Score Header */}
      {shouldShowScore && (
        <div data-preview-header className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <div className="bg-cyan-500 text-white text-xs font-bold px-2 py-1 rounded">
              {calculateScore(data)}%
            </div>
            <span className="text-sm text-gray-600">Your resume score ??</span>
          </div>
        </div>
      )}

      {/* Resume Content */}
      <div 
        data-resume-content
        className={cn('flex-1', renderAllPages ? 'overflow-visible' : 'overflow-hidden')}
        style={{
          // For preview mode: clip to A4 height per page, for PDF: let it flow
          height: renderAllPages ? 'auto' : '297mm',
          maxHeight: renderAllPages ? 'none' : '297mm',
          position: renderAllPages ? 'relative' : 'relative',
          backgroundColor: pageBackgroundColor
        }}
      >
        {/* Render all content continuously - both for PDF and preview */}
        {/* For preview, we'll clip and transform to show the appropriate page portion */}
        <div 
          data-pdf-content
          ref={pdfContentRef}
          style={{
            // For preview mode: use transform to scroll to the correct page
            transform: !renderAllPages ? `translateY(-${(visiblePage - 1) * A4_PAGE_HEIGHT_MM}mm)` : 'none',
            transition: !renderAllPages ? 'transform 0.3s ease' : 'none',
            height: renderAllPages ? 'auto' : 'auto',
            minHeight: renderAllPages ? undefined : `${Math.max(1, totalPages) * A4_PAGE_HEIGHT_MM}mm`,
            position: renderAllPages ? 'relative' : 'relative',
            width: '100%',
            background: isSidebarLayout
              ? `linear-gradient(to right, #374151 0mm, #374151 ${SIDEBAR_WIDTH_MM}mm, #ffffff ${SIDEBAR_WIDTH_MM}mm, #ffffff ${A4_PAGE_WIDTH_MM}mm)`
              : undefined
          }}
        >
          {renderResumeContent()}
        </div>
        
        {/* Page break indicators for preview mode */}
        {!renderAllPages && totalPages > 1 && visiblePage < totalPages && (
          <div 
            data-page-break-indicator
            className="absolute left-0 right-0 h-0.5 bg-gray-400 pointer-events-none"
            style={{ 
              top: `${visiblePage * A4_PAGE_HEIGHT_MM}mm`,
              zIndex: 10,
              boxShadow: '0 -2px 4px rgba(0,0,0,0.1)'
            }}
          />
        )}
      </div>

      {/* Footer with Pagination */}
      {shouldShowFooter && (
        <div data-preview-footer className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t text-sm text-gray-500">
          <div className="flex items-center gap-1">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span>Saved</span>
              </>
            )}
            {saveStatus === "error" && (
              <>
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span>Save failed</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, visiblePage - 1))}
                  disabled={visiblePage === 1}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium text-xs">
                  {visiblePage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, visiblePage + 1))}
                  disabled={visiblePage >= totalPages}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            {totalPages === 1 && <span className="text-xs">1 / 1</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function calculateScore(data: ResumeData): number {
  let score = 0;
  const maxScore = 100;

  // Contact info (20 points)
  if (data.contact.firstName) score += 4;
  if (data.contact.lastName) score += 4;
  if (data.contact.email) score += 4;
  if (data.contact.phone) score += 4;
  if (data.contact.desiredJobTitle) score += 4;

  // Experience (25 points)
  if (data.experiences.length > 0) {
    score += 10;
    if (data.experiences.length >= 2) score += 5;
    if (data.experiences.some((e) => e.description)) score += 10;
  }

  // Education (15 points)
  if (data.educations.length > 0) {
    score += 15;
  }

  // Skills (15 points)
  if (data.skills.length >= 3) {
    score += 15;
  } else if (data.skills.length > 0) {
    score += 8;
  }

  // Summary (15 points)
  if (data.summary && data.summary.length >= 50) {
    score += 15;
  } else if (data.summary) {
    score += 8;
  }

  // Finalize sections (10 points)
  if (data.finalize.languages.length > 0) score += 2;
  if (data.finalize.certifications.length > 0) score += 3;
  if (data.finalize.websites.length > 0) score += 2;
  if (data.finalize.awards.length > 0) score += 3;

  return Math.min(score, maxScore);
}
