import { ResumeTemplate } from './types/resume';
import { templates } from './data/templates';

// Convert templates data to ResumeTemplate format
// This maintains backward compatibility with existing code
export const resumeTemplates: ResumeTemplate[] = templates.map(template => ({
  ...template,
  // Use the first non-"all" category as the main category for backward compatibility
  category: (template.category.find(cat => cat !== 'all') || 'simple') as ResumeTemplate['category'],
}));

export const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;
export const languageProficiencies = ['Basic', 'Conversational', 'Fluent', 'Native'] as const;
