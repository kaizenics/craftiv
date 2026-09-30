'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import {
  normalizeSectionOrder,
  type Education,
  type Experience,
  type ResumeData,
  type ResumeSectionKey,
} from '@/lib/types/resume';

/**
 * Document designs for Aurora, Zenith, Pulse, Metro and Bold.
 *
 * These five share one section engine so spacing, hierarchy and wording stay
 * consistent, and differ in the parts a recruiter actually notices: the
 * masthead, the column structure, the section headings and how an experience
 * entry is set. Everything is plain DOM — the PDF export clones the preview and
 * inlines computed styles, so pseudo-element decoration would be dropped and is
 * deliberately avoided here.
 */

export interface TemplateDesignSettings {
  fontFamily: string;
  fontSize: number;
  sectionSpacing: number;
  paragraphSpacing: number;
  lineSpacing: number;
}

export interface TemplateDesignProps {
  data: ResumeData;
  design: TemplateDesignSettings;
  accent: string;
  showPhoto?: boolean;
}

const HAIRLINE = '#e4e4e7';

/**
 * The PDF export inlines computed styles but deliberately drops every width and
 * height, so decoration sized by those properties collapses to nothing in the
 * exported file. Rules are therefore drawn with a border, and fixed-size bars
 * and dots are sized with padding — both survive the export intact.
 */
function Rule({
  color,
  thickness = 1,
  className,
}: {
  color: string;
  thickness?: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{ borderTopWidth: `${thickness}px`, borderTopStyle: 'solid', borderTopColor: color }}
    />
  );
}

function AccentBar({
  color,
  width,
  height,
  radius,
  className,
}: {
  color: string;
  width: string;
  height: string;
  radius?: string;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        backgroundColor: color,
        paddingLeft: width,
        paddingTop: height,
        borderRadius: radius,
      }}
    />
  );
}

// In a two-column design the wide column carries the narrative sections and the
// narrow one carries the reference lists.
const MAIN_COLUMN_KEYS: ResumeSectionKey[] = [
  'summary',
  'experience',
  'education',
  'awards',
  'references',
  'custom',
];
const SIDE_COLUMN_KEYS: ResumeSectionKey[] = [
  'skills',
  'languages',
  'certifications',
  'websites',
  'hobbies',
];

const DEFAULT_TITLES: Record<ResumeSectionKey, string> = {
  summary: 'Profile',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  languages: 'Languages',
  certifications: 'Certifications',
  awards: 'Awards',
  websites: 'Links',
  references: 'References',
  hobbies: 'Interests',
  custom: '',
};

// ── Shared helpers ──────────────────────────────────────────────────────────

function fullName(data: ResumeData): string {
  const first = data.contact.firstName?.trim() || 'Your';
  const last = data.contact.lastName?.trim() || 'Name';
  return `${first} ${last}`;
}

function formatDateRange(start?: string, end?: string): string {
  const startValue = start?.trim() ?? '';
  const endValue = end?.trim() ?? '';

  if (!startValue && !endValue) return '';
  if (startValue && endValue) return `${startValue} – ${endValue}`;
  return startValue || endValue;
}

function experienceDates(exp: Experience): string {
  return formatDateRange(exp.startDate, exp.isCurrentJob ? 'Present' : exp.endDate);
}

function educationDates(edu: Education): string {
  return formatDateRange(edu.startDate, edu.endDate);
}

function joinMeta(parts: Array<string | undefined | null>): string {
  return parts.map((part) => part?.trim()).filter(Boolean).join(' · ');
}

function hasSectionContent(data: ResumeData, key: ResumeSectionKey): boolean {
  switch (key) {
    case 'summary':
      return Boolean(data.summary?.trim());
    case 'experience':
      return data.experiences.length > 0;
    case 'education':
      return data.educations.length > 0;
    case 'skills':
      return data.skills.length > 0;
    case 'languages':
      return data.finalize.languages.length > 0;
    case 'certifications':
      return data.finalize.certifications.length > 0;
    case 'awards':
      return data.finalize.awards.length > 0;
    case 'websites':
      return data.finalize.websites.length > 0;
    case 'references':
      return data.finalize.references.length > 0;
    case 'hobbies':
      return data.finalize.hobbies.length > 0;
    case 'custom':
      return data.finalize.customSections.length > 0;
    default:
      return false;
  }
}

/** Sections the user actually filled in, in the order they arranged them. */
function sectionKeys(data: ResumeData, allowed?: ResumeSectionKey[]): ResumeSectionKey[] {
  return normalizeSectionOrder(data.sectionOrder).filter(
    (key) => (!allowed || allowed.includes(key)) && hasSectionContent(data, key),
  );
}

const BULLET_PATTERN = /^(?:-|•|\*)\s+/;

interface DescriptionProps {
  text: string;
  className?: string;
  markerColor?: string;
  marker?: 'disc' | 'square';
}

/**
 * Renders a description as prose or as a real bullet list. Markers are colored
 * by setting the list color and restoring the text color on each item, so the
 * accent survives the PDF export (which only carries inline element styles).
 */
function Description({ text, className, markerColor, marker = 'disc' }: DescriptionProps) {
  const lines = text
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  const textClass = cn('text-zinc-700', className);

  if (!lines.some((line) => BULLET_PATTERN.test(line))) {
    return <p className={cn('whitespace-pre-line', textClass)}>{text.trim()}</p>;
  }

  const blocks: ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;
    const key = `list-${blocks.length}`;
    blocks.push(
      <ul
        key={key}
        className="pl-[1.1em]"
        style={{ listStyleType: marker, listStylePosition: 'outside', color: markerColor }}
      >
        {bullets.map((line, index) => (
          <li key={`${key}-${index}`} className="pl-[0.15em]">
            <span className={textClass}>{line.replace(BULLET_PATTERN, '')}</span>
          </li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  lines.forEach((line, index) => {
    if (BULLET_PATTERN.test(line)) {
      bullets.push(line);
      return;
    }
    flushBullets();
    blocks.push(
      <p key={`p-${index}`} className={textClass}>
        {line}
      </p>,
    );
  });

  flushBullets();

  return <div className="space-y-1">{blocks}</div>;
}

// ── Section engine ──────────────────────────────────────────────────────────

interface SectionKit {
  data: ResumeData;
  design: TemplateDesignSettings;
  accent: string;
  /** Renders the styled heading for a section, including its own bottom margin. */
  heading: (title: string) => ReactNode;
  titles?: Partial<Record<ResumeSectionKey, string>>;
  experience?: 'stacked' | 'timeline' | 'date-rail' | 'executive';
  education?: 'stacked' | 'date-rail' | 'executive';
  skills?: 'grid' | 'inline' | 'stack';
  skillColumns?: number;
  /** Reference lists read denser in a narrow column than in the reading column. */
  density?: 'main' | 'side';
  bullet?: 'disc' | 'square';
}

function sectionTitle(kit: SectionKit, key: ResumeSectionKey): string {
  return kit.titles?.[key] ?? DEFAULT_TITLES[key];
}

/** Entries need a little more air between them than paragraphs inside one. */
function entryGap(design: TemplateDesignSettings): number {
  return design.paragraphSpacing + 5;
}

function DatesText({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 whitespace-nowrap text-[0.86em] tabular-nums text-zinc-500">
      {children}
    </span>
  );
}

function ExperienceEntries({ kit }: { kit: SectionKit }) {
  const { data, design, accent } = kit;
  const variant = kit.experience ?? 'stacked';

  const body = (exp: Experience) => {
    if (variant === 'executive') {
      return (
        <>
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-semibold text-zinc-900">{exp.employer || 'Company'}</p>
            <DatesText>{experienceDates(exp)}</DatesText>
          </div>
          <div className="mt-0.5 flex items-baseline justify-between gap-4">
            <p
              className="text-[0.88em] font-semibold uppercase tracking-[0.1em]"
              style={{ color: accent }}
            >
              {exp.jobTitle || 'Role'}
            </p>
            {exp.location && (
              <span className="shrink-0 text-[0.86em] text-zinc-500">{exp.location}</span>
            )}
          </div>
        </>
      );
    }

    return (
      <>
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-semibold text-zinc-900">{exp.jobTitle || 'Role'}</p>
          {variant !== 'date-rail' && <DatesText>{experienceDates(exp)}</DatesText>}
        </div>
        <p className="mt-0.5 text-[0.96em] text-zinc-700">
          {variant === 'date-rail'
            ? exp.employer || 'Company'
            : joinMeta([exp.employer || 'Company', exp.location])}
        </p>
      </>
    );
  };

  const description = (exp: Experience) =>
    exp.description ? (
      <div className="mt-1.5">
        <Description
          text={exp.description}
          className="text-[0.96em]"
          markerColor={accent}
          marker={kit.bullet ?? 'disc'}
        />
      </div>
    ) : null;

  return (
    <div className="flex flex-col" style={{ gap: `${entryGap(design)}px` }}>
      {data.experiences.map((exp, i) => {
        if (variant === 'timeline') {
          const isLast = i === data.experiences.length - 1;
          return (
            <div
              key={exp.id}
              className="grid grid-cols-[9px_1fr] gap-x-4"
              style={{ breakInside: 'avoid' }}
            >
              <div className="flex flex-col items-center">
                <AccentBar
                  className="mt-[0.42em] shrink-0"
                  color={accent}
                  width="7px"
                  height="7px"
                  radius="9999px"
                />
                <span
                  className="flex-1"
                  style={{
                    // Run the line through the entry gap so it meets the next dot.
                    marginBottom: isLast ? 0 : `calc(-${entryGap(design)}px - 0.42em)`,
                    borderLeftWidth: '1px',
                    borderLeftStyle: 'solid',
                    borderLeftColor: `${accent}33`,
                  }}
                />
              </div>
              <div>
                {body(exp)}
                {description(exp)}
              </div>
            </div>
          );
        }

        if (variant === 'date-rail') {
          return (
            <div
              key={exp.id}
              className="grid grid-cols-[23%_1fr] gap-x-6"
              style={{ breakInside: 'avoid' }}
            >
              <div className="text-[0.86em] leading-[1.5] text-zinc-500">
                <p className="tabular-nums">{experienceDates(exp)}</p>
                {exp.location && <p className="mt-0.5">{exp.location}</p>}
              </div>
              <div>
                {body(exp)}
                {description(exp)}
              </div>
            </div>
          );
        }

        return (
          <div key={exp.id} style={{ breakInside: 'avoid' }}>
            {body(exp)}
            {description(exp)}
          </div>
        );
      })}
    </div>
  );
}

function EducationEntries({ kit }: { kit: SectionKit }) {
  const { data, design, accent } = kit;
  const variant = kit.education ?? 'stacked';

  const description = (edu: Education) =>
    edu.description ? (
      <div className="mt-1.5">
        <Description
          text={edu.description}
          className="text-[0.96em]"
          markerColor={accent}
          marker={kit.bullet ?? 'disc'}
        />
      </div>
    ) : null;

  return (
    <div className="flex flex-col" style={{ gap: `${entryGap(design)}px` }}>
      {data.educations.map((edu) => {
        if (variant === 'date-rail') {
          return (
            <div
              key={edu.id}
              className="grid grid-cols-[23%_1fr] gap-x-6"
              style={{ breakInside: 'avoid' }}
            >
              <div className="text-[0.86em] leading-[1.5] text-zinc-500">
                <p className="tabular-nums">{educationDates(edu)}</p>
                {edu.location && <p className="mt-0.5">{edu.location}</p>}
              </div>
              <div>
                <p className="font-semibold text-zinc-900">{edu.degree || 'Degree'}</p>
                <p className="mt-0.5 text-[0.96em] text-zinc-700">{edu.schoolName || 'School'}</p>
                {description(edu)}
              </div>
            </div>
          );
        }

        if (variant === 'executive') {
          return (
            <div key={edu.id} style={{ breakInside: 'avoid' }}>
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-semibold text-zinc-900">{edu.schoolName || 'School'}</p>
                <DatesText>{educationDates(edu)}</DatesText>
              </div>
              <p className="mt-0.5 text-[0.96em] text-zinc-700">
                {joinMeta([edu.degree || 'Degree', edu.location])}
              </p>
              {description(edu)}
            </div>
          );
        }

        return (
          <div key={edu.id} style={{ breakInside: 'avoid' }}>
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-semibold text-zinc-900">{edu.degree || 'Degree'}</p>
              <DatesText>{educationDates(edu)}</DatesText>
            </div>
            <p className="mt-0.5 text-[0.96em] text-zinc-700">
              {joinMeta([edu.schoolName || 'School', edu.location])}
            </p>
            {description(edu)}
          </div>
        );
      })}
    </div>
  );
}

function SkillsBlock({ kit }: { kit: SectionKit }) {
  const { data, accent } = kit;
  const variant = kit.skills ?? 'grid';

  const label = (name: string, level: string, showLevel: boolean) => (
    <>
      {name}
      {showLevel && <span className="text-zinc-500"> — {level}</span>}
    </>
  );

  if (variant === 'inline') {
    return (
      <p className="text-zinc-700">
        {data.skills.map((skill, index) => (
          <span key={skill.id}>
            {index > 0 && <span className="text-zinc-300"> · </span>}
            {label(skill.name, skill.level, skill.showLevel)}
          </span>
        ))}
      </p>
    );
  }

  if (variant === 'stack') {
    return (
      <div className="space-y-[3px] text-zinc-700">
        {data.skills.map((skill) => (
          <p key={skill.id}>{label(skill.name, skill.level, skill.showLevel)}</p>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid gap-x-6 gap-y-1"
      style={{ gridTemplateColumns: `repeat(${kit.skillColumns ?? 3}, minmax(0, 1fr))` }}
    >
      {data.skills.map((skill) => (
        <p key={skill.id} className="flex items-center gap-2 text-zinc-700">
          {/* Centered rather than nudged with a transform — the export drops those too. */}
          <AccentBar
            className="shrink-0"
            color={accent}
            width="3px"
            height="3px"
            radius="9999px"
          />
          <span>{label(skill.name, skill.level, skill.showLevel)}</span>
        </p>
      ))}
    </div>
  );
}

function ListRows({ children }: { children: ReactNode }) {
  return <div className="space-y-[5px]">{children}</div>;
}

function renderSectionBody(kit: SectionKit, key: ResumeSectionKey): ReactNode {
  const { data, design } = kit;
  const isSide = kit.density === 'side';

  switch (key) {
    case 'summary':
      return (
        <p className="whitespace-pre-line text-zinc-700">{data.summary.trim()}</p>
      );

    case 'experience':
      return <ExperienceEntries kit={kit} />;

    case 'education':
      return <EducationEntries kit={kit} />;

    case 'skills':
      return <SkillsBlock kit={kit} />;

    case 'languages':
      if (isSide) {
        return (
          <ListRows>
            {data.finalize.languages.map((lang) => (
              <p key={lang.id} className="flex items-baseline justify-between gap-3 text-zinc-700">
                <span>{lang.name}</span>
                <span className="shrink-0 text-[0.9em] text-zinc-500">{lang.proficiency}</span>
              </p>
            ))}
          </ListRows>
        );
      }
      return (
        <p className="text-zinc-700">
          {data.finalize.languages.map((lang, index) => (
            <span key={lang.id}>
              {index > 0 && <span className="text-zinc-300"> · </span>}
              {lang.name}
              <span className="text-zinc-500"> ({lang.proficiency})</span>
            </span>
          ))}
        </p>
      );

    case 'certifications':
      return (
        <ListRows>
          {data.finalize.certifications.map((cert) => (
            <div key={cert.id} style={{ breakInside: 'avoid' }}>
              <p className="font-medium text-zinc-900">{cert.name}</p>
              {joinMeta([cert.issuer, cert.date]) && (
                <p className="text-[0.9em] text-zinc-500">{joinMeta([cert.issuer, cert.date])}</p>
              )}
            </div>
          ))}
        </ListRows>
      );

    case 'awards':
      return (
        <ListRows>
          {data.finalize.awards.map((award) => (
            <div key={award.id} style={{ breakInside: 'avoid' }}>
              <p className="font-medium text-zinc-900">{award.title}</p>
              {joinMeta([award.issuer, award.date]) && (
                <p className="text-[0.9em] text-zinc-500">{joinMeta([award.issuer, award.date])}</p>
              )}
            </div>
          ))}
        </ListRows>
      );

    case 'websites':
      if (isSide) {
        return (
          <ListRows>
            {data.finalize.websites.map((site) => (
              <div key={site.id}>
                <p className="font-medium text-zinc-900">{site.label}</p>
                <p className="break-all text-[0.9em] text-zinc-500">{site.url}</p>
              </div>
            ))}
          </ListRows>
        );
      }
      return (
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {data.finalize.websites.map((site) => (
            <p key={site.id} className="text-zinc-700">
              <span className="font-medium text-zinc-900">{site.label}</span>{' '}
              <span className="break-all text-zinc-500">{site.url}</span>
            </p>
          ))}
        </div>
      );

    case 'references':
      return (
        <div
          className={cn('grid gap-x-8', isSide ? 'grid-cols-1' : 'grid-cols-2')}
          style={{ rowGap: `${design.paragraphSpacing}px` }}
        >
          {data.finalize.references.map((ref) => (
            <div key={ref.id} style={{ breakInside: 'avoid' }}>
              <p className="font-medium text-zinc-900">{ref.name}</p>
              <p className="text-[0.94em] text-zinc-700">{joinMeta([ref.position, ref.company])}</p>
              <p className="text-[0.9em] text-zinc-500">{joinMeta([ref.email, ref.phone])}</p>
            </div>
          ))}
        </div>
      );

    case 'hobbies':
      return (
        <p className="text-zinc-700">
          {data.finalize.hobbies.map((hobby, index) => (
            <span key={hobby.id}>
              {index > 0 && <span className="text-zinc-300"> · </span>}
              {hobby.name}
            </span>
          ))}
        </p>
      );

    default:
      return null;
  }
}

function SectionBlocks({ kit, keys }: { kit: SectionKit; keys: ResumeSectionKey[] }) {
  const { data, design } = kit;

  return (
    <>
      {keys.map((key) => {
        if (key === 'custom') {
          return (
            <div key="custom">
              {data.finalize.customSections.map((section) => (
                <div key={section.id} style={{ marginBottom: `${design.sectionSpacing}px` }}>
                  {kit.heading(section.sectionName || 'Additional Information')}
                  <Description
                    text={section.description}
                    markerColor={kit.accent}
                    marker={kit.bullet ?? 'disc'}
                  />
                </div>
              ))}
            </div>
          );
        }

        return (
          <div key={key} style={{ marginBottom: `${design.sectionSpacing}px` }}>
            {kit.heading(sectionTitle(kit, key))}
            {renderSectionBody(kit, key)}
          </div>
        );
      })}
    </>
  );
}

// ── Shared masthead pieces ──────────────────────────────────────────────────

function Photo({
  data,
  show,
  size,
  rounded,
}: {
  data: ResumeData;
  show: boolean;
  size: number;
  rounded: 'full' | 'sm';
}) {
  if (!show || !data.contact.photoUrl) return null;

  // Styled on the image itself: its width/height attributes still describe the
  // box after the export strips the CSS sizing off any wrapper.
  return (
    <Image
      src={data.contact.photoUrl}
      alt="Profile"
      width={size}
      height={size}
      className={cn(
        'shrink-0 border border-zinc-200 object-cover',
        rounded === 'full' ? 'rounded-full' : 'rounded-sm',
      )}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}

function ContactStack({ data, align = 'right' }: { data: ResumeData; align?: 'right' | 'left' }) {
  const items = [data.contact.email, data.contact.phone].filter(Boolean) as string[];
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        'shrink-0 text-[0.9em] leading-[1.65] text-zinc-600',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      {items.map((item) => (
        <p key={item} className="break-all">
          {item}
        </p>
      ))}
    </div>
  );
}

function ContactLine({ data, className }: { data: ResumeData; className?: string }) {
  const items = [data.contact.email, data.contact.phone].filter(Boolean) as string[];
  if (items.length === 0) return null;

  return (
    <p className={cn('text-[0.9em] text-zinc-600', className)}>
      {items.map((item, index) => (
        <span key={item}>
          {index > 0 && <span className="text-zinc-300"> · </span>}
          {item}
        </span>
      ))}
    </p>
  );
}

function pageStyle(design: TemplateDesignSettings) {
  return {
    fontSize: `${design.fontSize}px`,
    lineHeight: design.lineSpacing,
  };
}

// ── Aurora ──────────────────────────────────────────────────────────────────

/**
 * Editorial two-column sheet: quiet hairlines, a heading rule that runs to the
 * column edge, and a reference column that stays white so the page prints clean.
 */
export function AuroraDesign({ data, design, accent, showPhoto = false }: TemplateDesignProps) {
  const mainHeading = (title: string) => (
    <div
      className="flex items-center gap-3"
      style={{ marginBottom: `${design.paragraphSpacing}px` }}
    >
      <h2 className="text-[0.76em] font-semibold uppercase tracking-[0.2em] text-zinc-900">
        {title}
      </h2>
      <span
        className="flex-1"
        style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: `${accent}45` }}
      />
    </div>
  );

  const sideHeading = (title: string) => (
    <h2
      className="border-b pb-1 text-[0.72em] font-semibold uppercase tracking-[0.2em]"
      style={{
        color: accent,
        borderColor: HAIRLINE,
        marginBottom: `${Math.max(6, design.paragraphSpacing - 2)}px`,
      }}
    >
      {title}
    </h2>
  );

  const base = { data, design, accent, education: 'stacked' as const };

  return (
    <div className="bg-white" style={pageStyle(design)}>
      <header className="px-12 pb-6 pt-11">
        <div className="flex items-start justify-between gap-8">
          <div className="flex items-start gap-5">
            <Photo data={data} show={showPhoto} size={64} rounded="full" />
            <div>
              <h1 className="text-[2.15em] font-semibold leading-[1.1] tracking-tight text-zinc-900">
                {fullName(data)}
              </h1>
              {data.contact.desiredJobTitle && (
                <p
                  className="mt-2 text-[0.82em] font-semibold uppercase tracking-[0.22em]"
                  style={{ color: accent }}
                >
                  {data.contact.desiredJobTitle}
                </p>
              )}
            </div>
          </div>
          <ContactStack data={data} />
        </div>
      </header>

      <Rule className="mx-12" color={HAIRLINE} />

      <div className="grid grid-cols-[1.85fr_1fr]">
        <div className="py-7 pl-12 pr-9">
          <SectionBlocks
            kit={{ ...base, heading: mainHeading, density: 'main' }}
            keys={sectionKeys(data, MAIN_COLUMN_KEYS)}
          />
        </div>
        <aside className="border-l py-7 pl-9 pr-12" style={{ borderColor: HAIRLINE }}>
          <SectionBlocks
            kit={{ ...base, heading: sideHeading, density: 'side', skills: 'stack' }}
            keys={sectionKeys(data, SIDE_COLUMN_KEYS)}
          />
        </aside>
      </div>
    </div>
  );
}

// ── Zenith ──────────────────────────────────────────────────────────────────

/**
 * Executive single column: a double rule under the masthead, competencies set in
 * three scannable columns, and experience led by the employer rather than the
 * job title — the way senior resumes are read.
 */
export function ZenithDesign({ data, design, accent, showPhoto = false }: TemplateDesignProps) {
  const heading = (title: string) => (
    <h2
      className="border-b pb-1 text-[0.78em] font-semibold uppercase tracking-[0.22em] text-zinc-900"
      style={{ borderColor: `${accent}55`, marginBottom: `${design.paragraphSpacing}px` }}
    >
      {title}
    </h2>
  );

  return (
    <div className="bg-white" style={pageStyle(design)}>
      <header className="px-12 pt-11">
        <div className="flex items-end justify-between gap-8">
          <div className="flex items-center gap-5">
            <Photo data={data} show={showPhoto} size={72} rounded="full" />
            <div>
              <h1 className="text-[2.3em] font-bold leading-[1.05] tracking-tight text-zinc-900">
                {fullName(data)}
              </h1>
              {data.contact.desiredJobTitle && (
                <p className="mt-1.5 text-[1.05em] text-zinc-700">
                  {data.contact.desiredJobTitle}
                </p>
              )}
            </div>
          </div>
          <ContactStack data={data} />
        </div>
        <Rule className="mt-5" color={accent} thickness={3} />
        <Rule className="mt-[3px]" color={`${accent}45`} />
      </header>

      <div className="px-12 pb-10 pt-7">
        <SectionBlocks
          kit={{
            data,
            design,
            accent,
            heading,
            density: 'main',
            experience: 'executive',
            education: 'executive',
            skills: 'grid',
            skillColumns: 3,
            titles: {
              summary: 'Executive Summary',
              experience: 'Professional Experience',
              skills: 'Core Competencies',
            },
          }}
          keys={sectionKeys(data)}
        />
      </div>
    </div>
  );
}

// ── Pulse ───────────────────────────────────────────────────────────────────

/**
 * Modern two-column sheet with a timeline down the experience column and a
 * light reference rail — momentum without the dashboard-card look.
 */
export function PulseDesign({ data, design, accent, showPhoto = false }: TemplateDesignProps) {
  const heading = (title: string) => (
    <div
      className="flex items-center gap-2.5"
      style={{ marginBottom: `${design.paragraphSpacing}px` }}
    >
      <AccentBar color={accent} width="3px" height="0.9em" radius="2px" />
      <h2 className="text-[0.76em] font-semibold uppercase tracking-[0.18em] text-zinc-900">
        {title}
      </h2>
    </div>
  );

  const base = { data, design, accent, heading };

  return (
    <div className="bg-white" style={pageStyle(design)}>
      <header className="px-11 pb-6 pt-10">
        <div className="flex items-start justify-between gap-8">
          <div className="flex items-start gap-5">
            <Photo data={data} show={showPhoto} size={64} rounded="sm" />
            <div>
              <h1 className="text-[2.1em] font-semibold leading-[1.1] tracking-tight text-zinc-900">
                {fullName(data)}
              </h1>
              <AccentBar className="mt-2.5" color={accent} width="44px" height="3px" radius="2px" />
              {data.contact.desiredJobTitle && (
                <p className="mt-2.5 text-[1.02em] text-zinc-700">
                  {data.contact.desiredJobTitle}
                </p>
              )}
            </div>
          </div>
          <ContactStack data={data} />
        </div>
      </header>

      <div className="grid grid-cols-[1.8fr_1fr] border-t" style={{ borderColor: HAIRLINE }}>
        <div className="py-7 pl-11 pr-8">
          <SectionBlocks
            kit={{ ...base, density: 'main', experience: 'timeline' }}
            keys={sectionKeys(data, MAIN_COLUMN_KEYS)}
          />
        </div>
        <aside
          className="border-l py-7 pl-8 pr-11"
          style={{ borderColor: HAIRLINE, backgroundColor: '#fafafa' }}
        >
          <SectionBlocks
            kit={{ ...base, density: 'side', skills: 'stack' }}
            keys={sectionKeys(data, SIDE_COLUMN_KEYS)}
          />
        </aside>
      </div>
    </div>
  );
}

// ── Metro ───────────────────────────────────────────────────────────────────

/**
 * Ledger layout: every entry hangs off a date rail so dates, employers and roles
 * line up down the page. Headings sit under a rule, signage style.
 */
export function MetroDesign({ data, design, accent, showPhoto = false }: TemplateDesignProps) {
  const heading = (title: string) => (
    <div style={{ marginBottom: `${design.paragraphSpacing}px` }}>
      <Rule color={HAIRLINE} />
      <h2
        className="mt-2 text-[0.74em] font-semibold uppercase tracking-[0.24em]"
        style={{ color: accent }}
      >
        {title}
      </h2>
    </div>
  );

  return (
    <div className="bg-white" style={pageStyle(design)}>
      <header className="px-12 pb-5 pt-10">
        <div className="flex items-end justify-between gap-8">
          <div className="flex items-center gap-5">
            <Photo data={data} show={showPhoto} size={68} rounded="sm" />
            <div>
              <h1 className="text-[1.95em] font-semibold uppercase leading-[1.1] tracking-[0.06em] text-zinc-900">
                {fullName(data)}
              </h1>
              {data.contact.desiredJobTitle && (
                <p
                  className="mt-1.5 text-[0.86em] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: accent }}
                >
                  {data.contact.desiredJobTitle}
                </p>
              )}
            </div>
          </div>
          <ContactStack data={data} />
        </div>
      </header>

      <Rule className="mx-12" color={accent} thickness={3} />

      <div className="px-12 pb-10 pt-6">
        <SectionBlocks
          kit={{
            data,
            design,
            accent,
            heading,
            density: 'main',
            experience: 'date-rail',
            education: 'date-rail',
            skills: 'grid',
            skillColumns: 3,
          }}
          keys={sectionKeys(data)}
        />
      </div>
    </div>
  );
}

// ── Bold ────────────────────────────────────────────────────────────────────

/**
 * Masthead single column: a heavy accent rule under the name, square bullets and
 * bar-marked headings. Confident, but one straight reading order for ATS.
 */
export function BoldDesign({ data, design, accent, showPhoto = false }: TemplateDesignProps) {
  const heading = (title: string) => (
    <div
      className="flex items-center gap-2.5"
      style={{ marginBottom: `${design.paragraphSpacing}px` }}
    >
      <AccentBar className="shrink-0" color={accent} width="16px" height="3px" />
      <h2 className="text-[0.84em] font-bold uppercase tracking-[0.14em] text-zinc-900">
        {title}
      </h2>
    </div>
  );

  return (
    <div className="bg-white" style={pageStyle(design)}>
      <header className="px-12 pt-11">
        <div className="flex items-start justify-between gap-8">
          <h1 className="text-[2.45em] font-bold uppercase leading-[1.05] tracking-tight text-zinc-900">
            {fullName(data)}
          </h1>
          <Photo data={data} show={showPhoto} size={68} rounded="sm" />
        </div>

        <Rule className="mt-4" color={accent} thickness={6} />

        <div className="mt-3 flex items-baseline justify-between gap-6">
          {data.contact.desiredJobTitle ? (
            <p
              className="text-[0.92em] font-semibold uppercase tracking-[0.18em]"
              style={{ color: accent }}
            >
              {data.contact.desiredJobTitle}
            </p>
          ) : (
            <span />
          )}
          <ContactLine data={data} className="shrink-0 text-right" />
        </div>
      </header>

      <div className="px-12 pb-10 pt-7">
        <SectionBlocks
          kit={{
            data,
            design,
            accent,
            heading,
            density: 'main',
            bullet: 'square',
            skills: 'inline',
            education: 'stacked',
          }}
          keys={sectionKeys(data)}
        />
      </div>
    </div>
  );
}
