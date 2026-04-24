import { ResumeData, TemplateLayout } from '@/lib/types/resume';
import { DesignOptions, getBaseStyles, getLayoutStyles } from './styles';

interface HTMLGeneratorOptions {
  data: ResumeData;
  template: { primaryColor: string; layout?: TemplateLayout };
  designOptions: DesignOptions;
}

export function generateResumeHTML({ data, template, designOptions }: HTMLGeneratorOptions): string {
  const layout = template.layout || 'classic';
  const isHarvard = layout === 'harvard';

  const styles = getBaseStyles(designOptions) + `<style>${getLayoutStyles(layout, template.primaryColor, designOptions)}</style>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${data.contact.firstName} ${data.contact.lastName} - Resume</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Lato:wght@400;700&family=Montserrat:wght@400;600;700&family=Poppins:wght@400;600;700&family=Source+Sans+Pro:wght@400;600;700&family=Nunito:wght@400;600;700&family=Raleway:wght@400;600;700&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
      ${styles}
    </head>
    <body>
      ${generateHeader(data, layout)}
      ${!isHarvard && data.summary ? generateSummarySection(data.summary) : ''}
      ${isHarvard && data.educations.length > 0 ? generateEducationSection(data.educations, isHarvard) : ''}
      ${data.experiences.length > 0 ? generateExperienceSection(data.experiences, isHarvard) : ''}
      ${!isHarvard && data.educations.length > 0 ? generateEducationSection(data.educations, isHarvard) : ''}
      ${data.skills.length > 0 ? generateSkillsSection(data.skills, isHarvard) : ''}
      ${data.finalize.languages.length > 0 ? generateLanguagesSection(data.finalize.languages) : ''}
      ${data.finalize.certifications.length > 0 ? generateCertificationsSection(data.finalize.certifications) : ''}
      ${data.finalize.awards.length > 0 ? generateAwardsSection(data.finalize.awards) : ''}
      ${data.finalize.websites.length > 0 ? generateWebsitesSection(data.finalize.websites) : ''}
      ${data.finalize.references.length > 0 ? generateReferencesSection(data.finalize.references) : ''}
      ${data.finalize.hobbies.length > 0 ? generateHobbiesSection(data.finalize.hobbies) : ''}
      ${data.finalize.customSections.map(section => generateCustomSection(section)).join('')}
    </body>
    </html>
  `;
}

function generateHeader(data: ResumeData, layout: TemplateLayout): string {
  return `
    <div class="header">
      <div class="name">${data.contact.firstName || 'Your'} ${data.contact.lastName || 'Name'}</div>
      ${data.contact.desiredJobTitle ? `<div class="title">${data.contact.desiredJobTitle}</div>` : ''}
      <div class="contact-info">
        ${[data.contact.email, data.contact.phone].filter(Boolean).join(' | ')}
      </div>
    </div>
  `;
}

function generateSummarySection(summary: string): string {
  return `
    <div class="section">
      <div class="section-title">Professional Summary</div>
      <div class="summary">${summary}</div>
    </div>
  `;
}

function generateEducationSection(educations: ResumeData['educations'], isHarvard: boolean): string {
  return `
    <div class="section">
      <div class="section-title">Education</div>
      ${educations.map(edu => {
        if (isHarvard) {
          return `
            <div class="entry">
              <div class="entry-header">
                <span class="entry-title">${edu.schoolName}</span>
                <span class="entry-date">${edu.startDate} - ${edu.endDate}</span>
              </div>
              <div class="entry-position">${edu.degree}</div>
              ${edu.location ? `<div class="entry-subtitle">${edu.location}</div>` : ''}
              ${edu.description ? `<div class="entry-description">${edu.description}</div>` : ''}
            </div>
          `;
        } else {
          return `
            <div class="entry">
              <div class="entry-header">
                <span class="entry-title">${edu.degree}</span>
                <span class="entry-date">${edu.startDate} - ${edu.endDate}</span>
              </div>
              <div class="entry-subtitle">${edu.schoolName}${edu.location ? `, ${edu.location}` : ''}</div>
              ${edu.description ? `<div class="entry-description">${edu.description}</div>` : ''}
            </div>
          `;
        }
      }).join('')}
    </div>
  `;
}

function generateExperienceSection(experiences: ResumeData['experiences'], isHarvard: boolean): string {
  return `
    <div class="section">
      <div class="section-title">Experience</div>
      ${experiences.map(exp => `
        <div class="entry">
          <div class="entry-header">
            <span class="entry-title">${isHarvard ? exp.employer : exp.jobTitle}${!isHarvard && exp.employer ? `, ${exp.employer}` : ''}</span>
            <span class="entry-date">${exp.startDate} - ${exp.isCurrentJob ? 'Present' : exp.endDate}</span>
          </div>
          ${isHarvard ? `<div class="entry-position">${exp.jobTitle}</div>` : ''}
          ${exp.location ? `<div class="entry-subtitle">${exp.location}</div>` : ''}
          ${exp.description ? `<div class="entry-description">${exp.description}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function generateSkillsSection(skills: ResumeData['skills'], isHarvard: boolean): string {
  return `
    <div class="section">
      <div class="section-title">${isHarvard ? 'Skills & Interests' : 'Skills'}</div>
      ${isHarvard ? `
        <div>${skills.map(skill => skill.name).join(', ')}</div>
      ` : `
        <div class="skills-list">
          ${skills.map(skill => `
            <span class="skill-tag">${skill.name}${skill.showLevel ? ` (${skill.level})` : ''}</span>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

function generateLanguagesSection(languages: ResumeData['finalize']['languages']): string {
  return `
    <div class="section">
      <div class="section-title">Languages</div>
      <div>${languages.map(l => `${l.name} (${l.proficiency})`).join(', ')}</div>
    </div>
  `;
}

function generateCertificationsSection(certifications: ResumeData['finalize']['certifications']): string {
  return `
    <div class="section">
      <div class="section-title">Certifications</div>
      ${certifications.map(c => `<div>${c.name} - ${c.issuer} (${c.date})</div>`).join('')}
    </div>
  `;
}

function generateAwardsSection(awards: ResumeData['finalize']['awards']): string {
  return `
    <div class="section">
      <div class="section-title">Awards & Honors</div>
      ${awards.map(a => `<div>${a.title} - ${a.issuer} (${a.date})</div>`).join('')}
    </div>
  `;
}

function generateWebsitesSection(websites: ResumeData['finalize']['websites']): string {
  return `
    <div class="section">
      <div class="section-title">Links</div>
      <div>${websites.map(w => `${w.label}: ${w.url}`).join(' | ')}</div>
    </div>
  `;
}

function generateReferencesSection(references: ResumeData['finalize']['references']): string {
  return `
    <div class="section">
      <div class="section-title">References</div>
      ${references.map(r => `
        <div class="entry">
          <div class="entry-title">${r.name}</div>
          <div class="entry-subtitle">${r.position}${r.company ? `, ${r.company}` : ''}</div>
          <div style="font-size: 10pt; color: #666;">${r.email}${r.phone ? ` | ${r.phone}` : ''}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function generateHobbiesSection(hobbies: ResumeData['finalize']['hobbies']): string {
  return `
    <div class="section">
      <div class="section-title">Hobbies & Interests</div>
      <div>${hobbies.map(h => h.name).join(', ')}</div>
    </div>
  `;
}

function generateCustomSection(section: ResumeData['finalize']['customSections'][0]): string {
  return `
    <div class="section">
      <div class="section-title">${section.sectionName}</div>
      <div>${section.description}</div>
    </div>
  `;
}
