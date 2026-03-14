'use client';

import { ResumeData, TemplateLayout } from '@/lib/types/resume';
import { resumeTemplates } from '@/lib/resume-templates';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
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
  renderAllPages = false
}: ResumePreviewProps) {
  const template = resumeTemplates.find((t) => t.id === data.templateId) || resumeTemplates[0];
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
      const contentHeightPx = contentEl.scrollHeight;
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
  }, [data, designOptions, renderAllPages]);

  const totalPages = measuredTotalPages;
  const visiblePage = renderAllPages ? 1 : Math.min(currentPage, totalPages);
  const layout = template.layout || 'classic';
  const templateId = template.id;
  const isSidebarLayout = layout === 'sidebar' && templateId === 'astral';
  const shouldShowFooter = showFooter ?? !renderAllPages;
  const shouldShowScore = showScore && !renderAllPages;

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
      <div className="text-center border-b border-zinc-900 pb-3" style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
        {showPhoto && data.contact.photoUrl && (
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-zinc-200 mb-3">
            <Image src={data.contact.photoUrl} alt="Profile" width={96} height={96} className="object-cover w-full h-full" />
          </div>
        )}
        <h1 className="text-2xl font-bold uppercase tracking-wide text-zinc-900">
          {data.contact.firstName || 'YOUR'} {data.contact.lastName || 'NAME'}
        </h1>
        <div className="flex justify-center items-center gap-3 mt-2 text-sm text-zinc-600">
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.email && data.contact.phone && <span>•</span>}
          {data.contact.phone && <span>{data.contact.phone}</span>}
        </div>
      </div>

      {/* Education Section - Harvard puts education first */}
      {data.educations.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Education" layout="harvard" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
            {data.educations.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-zinc-900">{edu.schoolName || 'University'}</p>
                    <p className="text-zinc-700 italic">{edu.degree || 'Degree'}</p>
                    {edu.location && <p className="text-zinc-600 text-sm">{edu.location}</p>}
                  </div>
                  <p className="text-zinc-600 text-sm">
                    {edu.startDate || 'Start'} – {edu.endDate || 'End'}
                  </p>
                </div>
                {edu.description && <p className="text-zinc-600 mt-1">{edu.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience Section */}
      {data.experiences.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Experience" layout="harvard" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
            {data.experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-zinc-900">{exp.employer || 'Company'}</p>
                    <p className="text-zinc-700 italic">{exp.jobTitle || 'Position'}</p>
                    {exp.location && <p className="text-zinc-600 text-sm">{exp.location}</p>}
                  </div>
                  <p className="text-zinc-600 text-sm">
                    {exp.startDate || 'Start'} – {exp.isCurrentJob ? 'Present' : (exp.endDate || 'End')}
                  </p>
                </div>
                {exp.description && (
                  <p className="text-zinc-600 mt-1 whitespace-pre-line">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Section */}
      {data.skills.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Skills & Interests" layout="harvard" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <p className="text-zinc-700">
            {data.skills.map((skill) => skill.name).join(', ')}
          </p>
        </div>
      )}

      {/* Additional Sections */}
      {renderAdditionalSections('harvard')}
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
              <p className="text-zinc-600 mt-1">{data.contact.desiredJobTitle}</p>
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
                        {exp.location && <p className="text-zinc-500 text-sm">{exp.location}</p>}
                      </div>
                      <p className="text-zinc-500 text-sm">
                        {exp.startDate} – {exp.isCurrentJob ? 'Present' : exp.endDate}
                      </p>
                    </div>
                    {exp.description && (
                      <p className="text-zinc-600 mt-1 whitespace-pre-line">{exp.description}</p>
                    )}
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
                    <p className="text-zinc-500 text-sm">{edu.startDate} – {edu.endDate}</p>
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
                    {lang.name} – <span className="text-zinc-500">{lang.proficiency}</span>
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
                    {cert.name} – {cert.issuer} ({cert.date})
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
      className="flex items-stretch"
      style={{ 
        fontSize: `${designOptions.fontSize}px`,
        lineHeight: designOptions.lineSpacing
      }}
    >
      {/* Left Sidebar */}
      <div
        className="self-stretch p-6 text-white"
        style={{
          width: `${SIDEBAR_WIDTH_MM}mm`,
          flex: `0 0 ${SIDEBAR_WIDTH_MM}mm`,
          maxWidth: `${SIDEBAR_WIDTH_MM}mm`,
        }}
      >
        {/* Profile Avatar */}
        {showPhoto && data.contact.photoUrl ? (
          <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-white/30 mb-4">
            <Image src={data.contact.photoUrl} alt="Profile" width={80} height={80} className="object-cover w-full h-full" />
          </div>
        ) : (
          <div className="w-20 h-20 mx-auto rounded-full bg-white/20 mb-4 flex items-center justify-center text-2xl font-bold">
            {(data.contact.firstName?.[0] || 'Y')}{(data.contact.lastName?.[0] || 'N')}
          </div>
        )}
        
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">
            {data.contact.firstName || 'Your'} {data.contact.lastName || 'Name'}
          </h1>
          {data.contact.desiredJobTitle && (
            <p className="text-white/80 text-sm mt-1">{data.contact.desiredJobTitle}</p>
          )}
        </div>

        {/* Contact Info */}
        <div className="mb-6">
          <h3 className="font-bold uppercase text-sm tracking-wider border-b border-white/30 pb-1 mb-3">Contact</h3>
          <div className="space-y-2 text-sm text-white/90">
            {data.contact.email && <p>{data.contact.email}</p>}
            {data.contact.phone && <p>{data.contact.phone}</p>}
          </div>
        </div>

        {/* Skills */}
        {data.skills.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold uppercase text-sm tracking-wider border-b border-white/30 pb-1 mb-3">Skills</h3>
            <div className="flex flex-wrap gap-1">
              {data.skills.map((skill) => (
                <span
                  key={skill.id}
                  className="px-2 py-0.5 text-xs rounded bg-white/20"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {data.finalize.languages.length > 0 && (
          <div>
            <h3 className="font-bold uppercase text-sm tracking-wider border-b border-white/30 pb-1 mb-3">Languages</h3>
            <div className="space-y-1 text-sm text-white/90">
              {data.finalize.languages.map((lang) => (
                <p key={lang.id}>{lang.name} – {lang.proficiency}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Content */}
      <div
        className="p-6"
        style={{
          width: `${A4_PAGE_WIDTH_MM - SIDEBAR_WIDTH_MM}mm`,
          flex: `0 0 ${A4_PAGE_WIDTH_MM - SIDEBAR_WIDTH_MM}mm`,
          maxWidth: `${A4_PAGE_WIDTH_MM - SIDEBAR_WIDTH_MM}mm`,
        }}
      >
        {/* Summary */}
        {data.summary && (
          <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
            <SectionHeader title="About Me" layout="sidebar" color={activeColor} spacing={designOptions.paragraphSpacing} />
            <p className="text-zinc-600">{data.summary}</p>
          </div>
        )}

        {/* Experience */}
        {data.experiences.length > 0 && (
          <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
            <SectionHeader title="Experience" layout="sidebar" color={activeColor} spacing={designOptions.paragraphSpacing} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
              {data.experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold" style={{ color: activeColor }}>{exp.jobTitle}</p>
                      <p className="text-zinc-600">{exp.employer}</p>
                      {exp.location && <p className="text-zinc-500 text-sm">{exp.location}</p>}
                    </div>
                    <p className="text-zinc-500 text-sm">
                      {exp.startDate} – {exp.isCurrentJob ? 'Present' : exp.endDate}
                    </p>
                  </div>
                  {exp.description && (
                    <p className="text-zinc-600 mt-1 whitespace-pre-line">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.educations.length > 0 && (
          <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
            <SectionHeader title="Education" layout="sidebar" color={activeColor} spacing={designOptions.paragraphSpacing} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
              {data.educations.map((edu) => (
                <div key={edu.id}>
                  <p className="font-semibold" style={{ color: activeColor }}>{edu.degree}</p>
                  <p className="text-zinc-600">{edu.schoolName}</p>
                  <p className="text-zinc-500 text-sm">{edu.startDate} – {edu.endDate}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Sections */}
        {renderAdditionalSections('sidebar')}
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
        {/* Summary */}
        {data.summary && (
          <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
            <SectionHeader title="Profile" layout="bold" color={activeColor} spacing={designOptions.paragraphSpacing} />
            <p className="text-zinc-600">{data.summary}</p>
          </div>
        )}

        {/* Experience */}
        {data.experiences.length > 0 && (
          <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
            <SectionHeader title="Experience" layout="bold" color={activeColor} spacing={designOptions.paragraphSpacing} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
              {data.experiences.map((exp) => (
                <div key={exp.id} className="border-l-4 pl-4" style={{ borderColor: activeColor }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-zinc-800">{exp.jobTitle}</p>
                      <p className="font-semibold" style={{ color: activeColor }}>{exp.employer}</p>
                      {exp.location && <p className="text-zinc-500 text-sm">{exp.location}</p>}
                    </div>
                    <p className="text-zinc-500 text-sm">
                      {exp.startDate} – {exp.isCurrentJob ? 'Present' : exp.endDate}
                    </p>
                  </div>
                  {exp.description && (
                    <p className="text-zinc-600 mt-1 whitespace-pre-line">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.educations.length > 0 && (
          <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
            <SectionHeader title="Education" layout="bold" color={activeColor} spacing={designOptions.paragraphSpacing} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
              {data.educations.map((edu) => (
                <div key={edu.id} className="border-l-4 pl-4" style={{ borderColor: activeColor }}>
                  <p className="font-bold text-zinc-800">{edu.degree}</p>
                  <p style={{ color: activeColor }}>{edu.schoolName}</p>
                  <p className="text-zinc-500 text-sm">{edu.startDate} – {edu.endDate}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
            <SectionHeader title="Skills" layout="bold" color={activeColor} spacing={designOptions.paragraphSpacing} />
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill) => (
                <span
                  key={skill.id}
                  className="px-3 py-1 text-white rounded"
                  style={{ backgroundColor: activeColor }}
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Additional Sections */}
        {renderAdditionalSections('bold')}
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
          <p className="text-zinc-500 mt-1">{data.contact.desiredJobTitle}</p>
        )}
        <div className="flex justify-center gap-4 mt-2 text-sm text-zinc-400">
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>{data.contact.phone}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Summary" layout="minimal" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <p className="text-zinc-600">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experiences.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Experience" layout="minimal" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
            {data.experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-zinc-800">{exp.jobTitle}</p>
                    <p className="text-zinc-600">{exp.employer}</p>
                  </div>
                  <p className="text-zinc-400 text-sm">
                    {exp.startDate} – {exp.isCurrentJob ? 'Present' : exp.endDate}
                  </p>
                </div>
                {exp.description && (
                  <p className="text-zinc-500 mt-1 whitespace-pre-line">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.educations.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Education" layout="minimal" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
            {data.educations.map((edu) => (
              <div key={edu.id}>
                <p className="font-medium text-zinc-800">{edu.degree}</p>
                <p className="text-zinc-600">{edu.schoolName}</p>
                <p className="text-zinc-400 text-sm">{edu.startDate} – {edu.endDate}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Skills" layout="minimal" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <p className="text-zinc-600">
            {data.skills.map((skill) => skill.name).join(' • ')}
          </p>
        </div>
      )}

      {/* Additional Sections */}
      {renderAdditionalSections('minimal')}
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

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <p className="text-zinc-600 italic border-l-4 pl-4" style={{ borderColor: activeColor }}>
            {data.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experiences.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Professional Experience" layout="executive" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
            {data.experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-zinc-800">{exp.employer}</p>
                    <p className="font-semibold" style={{ color: activeColor }}>{exp.jobTitle}</p>
                    {exp.location && <p className="text-zinc-500">{exp.location}</p>}
                  </div>
                  <p className="text-zinc-500 text-sm">
                    {exp.startDate} – {exp.isCurrentJob ? 'Present' : exp.endDate}
                  </p>
                </div>
                {exp.description && (
                  <p className="text-zinc-600 mt-2 whitespace-pre-line">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.educations.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Education" layout="executive" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
            {data.educations.map((edu) => (
              <div key={edu.id}>
                <p className="font-bold text-zinc-800">{edu.schoolName}</p>
                <p style={{ color: activeColor }}>{edu.degree}</p>
                <p className="text-zinc-500 text-sm">{edu.startDate} – {edu.endDate}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills & Expertise */}
      {data.skills.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Core Competencies" layout="executive" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div className="grid grid-cols-3 gap-2">
            {data.skills.map((skill) => (
              <div
                key={skill.id}
                className="text-center py-1 border rounded"
                style={{ borderColor: activeColor, color: activeColor }}
              >
                {skill.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Sections */}
      {renderAdditionalSections('executive')}
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
          <p className="text-gray-600 mt-1">{data.contact.desiredJobTitle}</p>
        )}
        <div className="flex justify-center gap-4 mt-2 text-gray-500">
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>{data.contact.phone}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Summary" layout="classic" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <p className="text-gray-600">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experiences.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Experience" layout="classic" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
            {data.experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">
                      {exp.jobTitle || 'Job Title'}, {exp.employer || 'Company name'}
                    </p>
                    <p className="text-gray-500">{exp.location}</p>
                  </div>
                  <p className="text-gray-500 text-sm">
                    {exp.startDate || 'Start'} – {exp.isCurrentJob ? 'Present' : (exp.endDate || 'End')}
                  </p>
                </div>
                {exp.description && (
                  <p className="text-gray-600 mt-1 whitespace-pre-line">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.educations.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Education" layout="classic" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
            {data.educations.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{edu.degree || 'Degree'}</p>
                    <p className="text-gray-500">
                      {edu.schoolName || 'School'}, {edu.location}
                    </p>
                  </div>
                  <p className="text-gray-500 text-sm">
                    {edu.startDate || 'Start'} – {edu.endDate || 'End'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Skills" layout="classic" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <span
                key={skill.id}
                className="px-2 py-1 bg-gray-100 rounded"
                style={{ color: activeColor }}
              >
                {skill.name}
                {skill.showLevel && skill.level && (
                  <span className="text-gray-500"> • {skill.level}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Additional Sections */}
      {renderAdditionalSections('classic')}
    </div>
  );

  const renderOrbitLayout = () => (
    <div
      className="bg-white"
      style={{
        fontSize: `${designOptions.fontSize}px`,
        lineHeight: designOptions.lineSpacing
      }}
    >
      <div className="p-6 pb-4" style={{ borderBottom: `2px solid ${activeColor}` }}>
        <div className="flex items-start gap-4">
          <div className="flex items-center gap-3">
            {showPhoto && data.contact.photoUrl && (
              <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-zinc-200 shrink-0">
                <Image src={data.contact.photoUrl} alt="Profile" width={64} height={64} className="object-cover w-full h-full" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">
                {data.contact.firstName || 'Your'} {data.contact.lastName || 'Name'}
              </h1>
              {data.contact.desiredJobTitle && (
                <p className="text-zinc-600 mt-1">{data.contact.desiredJobTitle}</p>
              )}
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-zinc-500">
                {data.contact.email && <span>{data.contact.email}</span>}
                {data.contact.phone && <span>{data.contact.phone}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6 p-6">
        <div className="col-span-3 space-y-4">
          {data.summary && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Profile" layout="bold" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <p className="text-zinc-600">{data.summary}</p>
            </div>
          )}

          {data.experiences.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Experience Orbit" layout="bold" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
                {data.experiences.map((exp) => (
                  <div key={exp.id} className="relative pl-5 border-l-2" style={{ borderColor: `${activeColor}55` }}>
                    <span
                      className="absolute -left-[5px] top-1 h-2 w-2 rounded-full"
                      style={{ backgroundColor: activeColor }}
                    />
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="font-semibold text-zinc-900">{exp.jobTitle || 'Role'}</p>
                        <p className="text-zinc-600">{exp.employer || 'Company'}</p>
                        {exp.location && <p className="text-zinc-500 text-sm">{exp.location}</p>}
                      </div>
                      <p className="text-zinc-500 text-sm text-right">
                        {exp.startDate || 'Start'} - {exp.isCurrentJob ? 'Present' : (exp.endDate || 'End')}
                      </p>
                    </div>
                    {exp.description && <p className="text-zinc-600 mt-1 whitespace-pre-line">{exp.description}</p>}
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
                  <div key={edu.id}>
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="font-semibold text-zinc-900">{edu.degree || 'Degree'}</p>
                        <p className="text-zinc-600">{edu.schoolName || 'School'}</p>
                        {edu.location && <p className="text-zinc-500 text-sm">{edu.location}</p>}
                      </div>
                      <p className="text-zinc-500 text-sm">{edu.startDate || 'Start'} - {edu.endDate || 'End'}</p>
                    </div>
                    {edu.description && <p className="text-zinc-600 mt-1">{edu.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-2 space-y-4">
          {data.skills.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Skills" layout="bold" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div className="flex flex-wrap gap-1">
                {data.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-2 py-1 rounded text-sm"
                    style={{ backgroundColor: `${activeColor}12`, color: activeColor }}
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {renderAdditionalSections('bold')}
        </div>
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
            {data.contact.desiredJobTitle && <p className="text-zinc-600 mt-1">{data.contact.desiredJobTitle}</p>}
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
                        {exp.location && <p className="text-zinc-500 text-sm">{exp.location}</p>}
                      </div>
                      <p className="text-zinc-500 text-sm">
                        {exp.startDate || 'Start'} - {exp.isCurrentJob ? 'Present' : (exp.endDate || 'End')}
                      </p>
                    </div>
                    {exp.description && <p className="text-zinc-600 mt-1 whitespace-pre-line">{exp.description}</p>}
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
                    <p className="text-zinc-500 text-sm">
                      {edu.startDate || 'Start'} - {edu.endDate || 'End'}
                    </p>
                    {edu.description && <p className="text-zinc-600 mt-1">{edu.description}</p>}
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
      <div
        className="p-6 pb-5"
        style={{
          backgroundColor: `${activeColor}12`,
          borderBottom: `1px solid ${activeColor}40`
        }}
      >
        <div className="flex items-center gap-4">
          {showPhoto && data.contact.photoUrl && (
            <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-zinc-200 shrink-0">
              <Image src={data.contact.photoUrl} alt="Profile" width={64} height={64} className="object-cover w-full h-full" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">
              {data.contact.firstName || 'Your'} {data.contact.lastName || 'Name'}
            </h1>
            {data.contact.desiredJobTitle && <p className="text-zinc-600 mt-1">{data.contact.desiredJobTitle}</p>}
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-zinc-500">
              {data.contact.email && <span>{data.contact.email}</span>}
              {data.contact.phone && <span>{data.contact.phone}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5">
        <div className="col-span-3 p-6">
          {data.summary && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Profile" layout="sidebar" color={activeColor} spacing={designOptions.paragraphSpacing} />
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
                        {exp.location && <p className="text-zinc-500 text-sm">{exp.location}</p>}
                      </div>
                      <p className="text-zinc-500 text-sm">
                        {exp.startDate || 'Start'} - {exp.isCurrentJob ? 'Present' : (exp.endDate || 'End')}
                      </p>
                    </div>
                    {exp.description && <p className="text-zinc-600 mt-1 whitespace-pre-line">{exp.description}</p>}
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
                    <p className="text-zinc-500 text-sm">{edu.startDate || 'Start'} - {edu.endDate || 'End'}</p>
                    {edu.description && <p className="text-zinc-600 mt-1">{edu.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {renderFinalizeTailSections('sidebar')}
        </div>

        <aside className="col-span-2 p-6 space-y-4" style={{ backgroundColor: `${activeColor}10` }}>
          <div>
            <p className="font-bold uppercase tracking-wide text-sm mb-2" style={{ color: activeColor }}>
              Contact
            </p>
            <div className="space-y-1 text-zinc-700">
              {data.contact.email && <p>{data.contact.email}</p>}
              {data.contact.phone && <p>{data.contact.phone}</p>}
            </div>
          </div>

          {data.skills.length > 0 && (
            <div>
              <p className="font-bold uppercase tracking-wide text-sm mb-2" style={{ color: activeColor }}>
                Skills
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
      <div className="text-center border-y py-4" style={{ borderColor: `${activeColor}50`, marginBottom: `${designOptions.sectionSpacing}px` }}>
        {showPhoto && data.contact.photoUrl && (
          <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-zinc-200 mb-3">
            <Image src={data.contact.photoUrl} alt="Profile" width={80} height={80} className="object-cover w-full h-full" />
          </div>
        )}
        <h1 className="text-3xl font-bold" style={{ color: activeColor }}>
          {data.contact.firstName || 'Your'} {data.contact.lastName || 'Name'}
        </h1>
        {data.contact.desiredJobTitle && (
          <p className="text-zinc-600 mt-1">{data.contact.desiredJobTitle}</p>
        )}
        <div className="flex flex-wrap justify-center gap-3 mt-2 text-sm text-zinc-500">
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>{data.contact.phone}</span>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3" style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
        <div className="rounded border p-3 text-center" style={{ borderColor: `${activeColor}55` }}>
          <p className="text-xs uppercase text-zinc-500">Experience</p>
          <p className="text-xl font-bold" style={{ color: activeColor }}>{Math.max(1, data.experiences.length)}</p>
          <p className="text-xs text-zinc-500">Roles</p>
        </div>
        <div className="rounded border p-3 text-center" style={{ borderColor: `${activeColor}55` }}>
          <p className="text-xs uppercase text-zinc-500">Skills</p>
          <p className="text-xl font-bold" style={{ color: activeColor }}>{Math.max(1, data.skills.length)}</p>
          <p className="text-xs text-zinc-500">Competencies</p>
        </div>
        <div className="rounded border p-3 text-center" style={{ borderColor: `${activeColor}55` }}>
          <p className="text-xs uppercase text-zinc-500">Education</p>
          <p className="text-xl font-bold" style={{ color: activeColor }}>{Math.max(1, data.educations.length)}</p>
          <p className="text-xs text-zinc-500">Institutions</p>
        </div>
      </div>

      {data.summary && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Executive Summary" layout="executive" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <p className="text-zinc-600 italic border-l-4 pl-4" style={{ borderColor: activeColor }}>
            {data.summary}
          </p>
        </div>
      )}

      {data.experiences.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Professional Experience" layout="executive" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
            {data.experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-bold text-zinc-900">{exp.jobTitle || 'Role'}</p>
                    <p className="text-zinc-700">{exp.employer || 'Company'}</p>
                    {exp.location && <p className="text-zinc-500 text-sm">{exp.location}</p>}
                  </div>
                  <p className="text-zinc-500 text-sm">
                    {exp.startDate || 'Start'} - {exp.isCurrentJob ? 'Present' : (exp.endDate || 'End')}
                  </p>
                </div>
                {exp.description && <p className="text-zinc-600 mt-1 whitespace-pre-line">{exp.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.educations.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Education" layout="executive" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
            {data.educations.map((edu) => (
              <div key={edu.id}>
                <p className="font-semibold text-zinc-900">{edu.schoolName || 'School'}</p>
                <p style={{ color: activeColor }}>{edu.degree || 'Degree'}</p>
                <p className="text-zinc-500 text-sm">{edu.startDate || 'Start'} - {edu.endDate || 'End'}</p>
                {edu.description && <p className="text-zinc-600 mt-1">{edu.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.skills.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Core Competencies" layout="executive" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div className="grid grid-cols-2 gap-2">
            {data.skills.map((skill) => (
              <div key={skill.id} className="rounded border px-3 py-1 text-center" style={{ borderColor: `${activeColor}50`, color: activeColor }}>
                {skill.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {renderAdditionalSections('executive')}
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
      <div className="p-6 text-white" style={{ backgroundColor: activeColor }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">
              {data.contact.firstName || 'Your'} {data.contact.lastName || 'Name'}
            </h1>
            {data.contact.desiredJobTitle && (
              <p className="mt-1 text-white/85">{data.contact.desiredJobTitle}</p>
            )}
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Pulse</span>
        </div>
        <div className="flex flex-wrap gap-3 mt-3 text-sm text-white/80">
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>{data.contact.phone}</span>}
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
                  <div key={exp.id} className="rounded border p-3" style={{ borderColor: `${activeColor}25` }}>
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="font-semibold text-zinc-900">{exp.jobTitle || 'Role'}</p>
                        <p className="text-zinc-600">{exp.employer || 'Company'}</p>
                        {exp.location && <p className="text-zinc-500 text-sm">{exp.location}</p>}
                      </div>
                      <p className="text-zinc-500 text-sm">
                        {exp.startDate || 'Start'} - {exp.isCurrentJob ? 'Present' : (exp.endDate || 'End')}
                      </p>
                    </div>
                    {exp.description && <p className="text-zinc-600 mt-2 whitespace-pre-line">{exp.description}</p>}
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
                    <p className="text-zinc-500 text-sm">{edu.startDate || 'Start'} - {edu.endDate || 'End'}</p>
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
                    className="px-2 py-1 rounded text-sm"
                    style={{ backgroundColor: `${activeColor}12`, color: activeColor }}
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
              <p className="text-zinc-600 mt-1">{data.contact.desiredJobTitle}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-2 text-sm text-zinc-500">
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>{data.contact.phone}</span>}
        </div>
      </div>

      {data.summary && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Summary" layout="harvard" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <p className="text-zinc-700">{data.summary}</p>
        </div>
      )}

      {data.experiences.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Experience" layout="harvard" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
            {data.experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-semibold text-zinc-900">{exp.jobTitle || 'Role'}</p>
                    <p className="text-zinc-700">{exp.employer || 'Company'}{exp.location ? `, ${exp.location}` : ''}</p>
                  </div>
                  <p className="text-zinc-500 text-sm">
                    {exp.startDate || 'Start'} - {exp.isCurrentJob ? 'Present' : (exp.endDate || 'End')}
                  </p>
                </div>
                {exp.description && <p className="text-zinc-700 mt-1 whitespace-pre-line">{exp.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.educations.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Education" layout="harvard" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
            {data.educations.map((edu) => (
              <div key={edu.id} className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-semibold text-zinc-900">{edu.schoolName || 'School'}</p>
                  <p className="text-zinc-700">{edu.degree || 'Degree'}</p>
                </div>
                <p className="text-zinc-500 text-sm">{edu.startDate || 'Start'} - {edu.endDate || 'End'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.skills.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Skills" layout="harvard" color={activeColor} spacing={designOptions.paragraphSpacing} />
          <p className="text-zinc-700">{data.skills.map((skill) => skill.name).join(', ')}</p>
        </div>
      )}

      {renderAdditionalSections('harvard')}
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
          {data.contact.desiredJobTitle && <p className="text-white/80 mt-2">{data.contact.desiredJobTitle}</p>}

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
                        {exp.location && <p className="text-zinc-500 text-sm">{exp.location}</p>}
                      </div>
                      <p className="text-zinc-500 text-sm">
                        {exp.startDate || 'Start'} - {exp.isCurrentJob ? 'Present' : (exp.endDate || 'End')}
                      </p>
                    </div>
                    {exp.description && <p className="text-zinc-600 mt-1 whitespace-pre-line">{exp.description}</p>}
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
                    <p className="text-zinc-500 text-sm">{edu.startDate || 'Start'} - {edu.endDate || 'End'}</p>
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
      <div className="grid grid-cols-5">
        <aside className="col-span-2 p-6 text-white" style={{ backgroundColor: '#111827' }}>
          <p className="text-xs uppercase tracking-[0.25em]" style={{ color: activeColor }}>Bold</p>
          <h1 className="text-3xl font-bold mt-2 leading-tight">
            {data.contact.firstName || 'Your'} {data.contact.lastName || 'Name'}
          </h1>
          {data.contact.desiredJobTitle && (
            <p className="text-white/80 mt-2">{data.contact.desiredJobTitle}</p>
          )}

          <div className="mt-4 space-y-1 text-white/85">
            {data.contact.email && <p>{data.contact.email}</p>}
            {data.contact.phone && <p>{data.contact.phone}</p>}
          </div>

          {data.skills.length > 0 && (
            <div className="mt-6">
              <p className="font-bold uppercase tracking-wide text-sm border-b border-white/30 pb-1 mb-2">
                Skills
              </p>
              <div className="flex flex-wrap gap-1">
                {data.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-2 py-1 rounded text-sm"
                    style={{ backgroundColor: `${activeColor}30`, color: '#ffffff' }}
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>

        <main className="col-span-3 p-6">
          {data.summary && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Profile" layout="bold" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <p className="text-zinc-600">{data.summary}</p>
            </div>
          )}

          {data.experiences.length > 0 && (
            <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
              <SectionHeader title="Experience" layout="bold" color={activeColor} spacing={designOptions.paragraphSpacing} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${designOptions.paragraphSpacing}px` }}>
                {data.experiences.map((exp) => (
                  <div key={exp.id} className="rounded border p-3" style={{ borderColor: `${activeColor}35` }}>
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="font-semibold text-zinc-900">{exp.jobTitle || 'Role'}</p>
                        <p style={{ color: activeColor }}>{exp.employer || 'Company'}</p>
                        {exp.location && <p className="text-zinc-500 text-sm">{exp.location}</p>}
                      </div>
                      <p className="text-zinc-500 text-sm">
                        {exp.startDate || 'Start'} - {exp.isCurrentJob ? 'Present' : (exp.endDate || 'End')}
                      </p>
                    </div>
                    {exp.description && <p className="text-zinc-600 mt-1 whitespace-pre-line">{exp.description}</p>}
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
                  <div key={edu.id} className="rounded border p-3" style={{ borderColor: `${activeColor}35` }}>
                    <p className="font-semibold text-zinc-900">{edu.degree || 'Degree'}</p>
                    <p style={{ color: activeColor }}>{edu.schoolName || 'School'}</p>
                    <p className="text-zinc-500 text-sm">{edu.startDate || 'Start'} - {edu.endDate || 'End'}</p>
                    {edu.description && <p className="text-zinc-600 mt-1">{edu.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {renderAdditionalSections('bold')}
        </main>
      </div>
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
                {cert.name} – {cert.issuer} ({cert.date})
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
                {award.title} – {award.issuer} ({award.date})
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
        'bg-white overflow-hidden flex flex-col',
        plain ? 'rounded-none shadow-none' : 'shadow-xl rounded-lg',
        className
      )} 
      style={{ 
        fontFamily: designOptions.fontFamily,
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
            <span className="text-sm text-gray-600">Your resume score 😊</span>
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
          position: renderAllPages ? 'relative' : 'relative'
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
            minHeight: `${Math.max(1, totalPages) * A4_PAGE_HEIGHT_MM}mm`,
            position: renderAllPages ? 'relative' : 'relative',
            width: '100%',
            background: isSidebarLayout
              ? `linear-gradient(to right, ${activeColor} 0mm, ${activeColor} ${SIDEBAR_WIDTH_MM}mm, #ffffff ${SIDEBAR_WIDTH_MM}mm, #ffffff ${A4_PAGE_WIDTH_MM}mm)`
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
            <Check className="h-4 w-4 text-green-500" />
            <span>Saved</span>
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

