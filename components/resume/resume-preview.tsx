'use client';

import { ResumeData, ResumeTemplate, TemplateLayout } from '@/lib/types/resume';
import { resumeTemplates } from '@/lib/resume-templates';
import { cn } from '@/lib/utils';
import { useState } from 'react';
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
  
  // Calculate if we need multiple pages based on content
  // Note: Actual page count will be determined by content height, but we estimate
  const hasSecondPageContent = 
    data.finalize.references.length > 0 ||
    data.finalize.hobbies.length > 0 ||
    data.finalize.awards.length > 0 ||
    data.finalize.customSections.length > 0;
  
  // Estimate total pages - content will naturally flow and fill pages
  // We'll show at least 1 page, and 2 if there's additional content
  // The actual split will happen naturally at 297mm boundaries
  const totalPages = hasSecondPageContent ? 2 : 1;
  const layout = template.layout || 'classic';
  const shouldShowFooter = showFooter ?? !renderAllPages;
  const shouldShowScore = showScore && !renderAllPages;

  // Render the appropriate layout
  const renderResumeContent = () => {
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
        </div>
      </div>
    </div>
  );

  // Sidebar Layout - Left sidebar with contact/skills, right content
  const renderSidebarLayout = () => (
    <div
      className="flex min-h-150"
      style={{ 
        fontSize: `${designOptions.fontSize}px`,
        lineHeight: designOptions.lineSpacing
      }}
    >
      {/* Left Sidebar */}
      <div className="w-1/3 p-6 text-white" style={{ backgroundColor: activeColor }}>
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
      <div className="flex-1 p-6 bg-white">
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
    </>
  );

  // Render page 2 content (additional sections)
  // When renderAllPages is true (PDF export), we render without min-height for continuous flow
  const renderPage2Content = () => (
    <div
      className={cn('p-8', !renderAllPages && 'min-h-150')}
      style={{ 
        borderTop: layout === 'classic' && !renderAllPages ? `4px solid ${activeColor}` : undefined,
        backgroundColor: layout === 'sidebar' ? undefined : 'white',
        fontSize: `${designOptions.fontSize}px`,
        lineHeight: designOptions.lineSpacing
      }}
    >

      {/* Awards & Honors */}
      {data.finalize.awards.length > 0 && (
        <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
          <SectionHeader title="Awards & Honors" layout={layout} color={activeColor} spacing={designOptions.paragraphSpacing} />
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
          <SectionHeader title="References" layout={layout} color={activeColor} spacing={designOptions.paragraphSpacing} />
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
          <SectionHeader title="Hobbies & Interests" layout={layout} color={activeColor} spacing={designOptions.paragraphSpacing} />
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
          <SectionHeader title={section.sectionName} layout={layout} color={activeColor} spacing={designOptions.paragraphSpacing} />
          <p className="text-gray-600">{section.description}</p>
        </div>
      ))}
    </div>
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
          style={{
            // For preview mode: use transform to scroll to the correct page
            transform: !renderAllPages ? `translateY(-${(currentPage - 1) * 297}mm)` : 'none',
            transition: !renderAllPages ? 'transform 0.3s ease' : 'none',
            height: renderAllPages ? 'auto' : 'auto',
            minHeight: renderAllPages ? 'auto' : `${Math.ceil((hasSecondPageContent ? 2 : 1)) * 297}mm`,
            position: renderAllPages ? 'relative' : 'relative',
            width: '100%'
          }}
        >
          {renderResumeContent()}
          {/* Always render additional sections if they exist - let natural page break handle splitting */}
          {(data.finalize.awards.length > 0 || 
            data.finalize.references.length > 0 || 
            data.finalize.hobbies.length > 0 || 
            data.finalize.customSections.length > 0) && (
            <div 
              className="px-8 pb-8"
              style={{ 
                backgroundColor: 'white',
                fontSize: `${designOptions.fontSize}px`,
                lineHeight: designOptions.lineSpacing,
                marginTop: 0, // Ensure no gap between main content and additional sections
                paddingTop: 0 // No top padding since it flows directly after main content
              }}
            >
              {/* Awards & Honors */}
              {data.finalize.awards.length > 0 && (
                <div style={{ marginBottom: `${designOptions.sectionSpacing}px` }}>
                  <SectionHeader title="Awards & Honors" layout={layout} color={activeColor} spacing={designOptions.paragraphSpacing} />
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
                  <SectionHeader title="References" layout={layout} color={activeColor} spacing={designOptions.paragraphSpacing} />
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
                  <SectionHeader title="Hobbies & Interests" layout={layout} color={activeColor} spacing={designOptions.paragraphSpacing} />
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
                  <SectionHeader title={section.sectionName} layout={layout} color={activeColor} spacing={designOptions.paragraphSpacing} />
                  <p className="text-gray-600">{section.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Page break indicators for preview mode */}
        {!renderAllPages && (
          <>
            {/* Page 1 break line */}
            <div 
              data-page-break-indicator
              className="absolute left-0 right-0 h-0.5 bg-gray-400 pointer-events-none"
              style={{ 
                top: '297mm',
                zIndex: 10,
                boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
                display: currentPage === 1 ? 'block' : 'none'
              }}
            />
            {/* Page 2 break line (if content extends beyond 2 pages) */}
            <div 
              data-page-break-indicator
              className="absolute left-0 right-0 h-0.5 bg-gray-400 pointer-events-none"
              style={{ 
                top: '594mm',
                zIndex: 10,
                boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
                display: currentPage === 2 ? 'block' : 'none'
              }}
            />
          </>
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
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium text-xs">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(2)}
                  disabled={currentPage === 2}
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
