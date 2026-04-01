'use client';

import { ResumeTemplate } from '@/lib/types/resume';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { FileText } from '@/components/ui/icons';

interface TemplateCardProps {
  template: ResumeTemplate;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const router = useRouter();

  const handleUseTemplate = () => {
    // Store the selected template in localStorage and navigate to section page
    localStorage.setItem('selectedTemplateId', template.id);
    router.push('/resume/section');
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/50">
      {/* Template Preview */}
      <div 
        className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
      >
        {/* Placeholder Resume Preview */}
        <div 
          className="absolute inset-4 rounded-lg bg-white shadow-md dark:bg-gray-900 p-4 flex flex-col"
          style={{ borderTop: `4px solid ${template.primaryColor}` }}
        >
          {/* Header section */}
          <div className="space-y-1 mb-3">
            <div 
              className="h-3 w-3/4 rounded"
              style={{ backgroundColor: template.primaryColor }}
            />
            <div className="h-2 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          
          {/* Contact info placeholder */}
          <div className="flex gap-2 mb-3">
            <div className="h-1.5 w-16 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-1.5 w-20 rounded bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Section placeholder */}
          <div className="space-y-2 flex-1">
            <div 
              className="h-2 w-20 rounded"
              style={{ backgroundColor: template.primaryColor, opacity: 0.7 }}
            />
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-1.5 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-1.5 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            
            <div 
              className="h-2 w-24 rounded mt-3"
              style={{ backgroundColor: template.primaryColor, opacity: 0.7 }}
            />
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-1.5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Button 
            onClick={handleUseTemplate}
            className="transform scale-95 transition-transform duration-300 group-hover:scale-100"
            size="lg"
          >
            <FileText className="mr-2 h-4 w-4" />
            Use this template
          </Button>
        </div>
      </div>

      {/* Template Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg">{template.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
        <div className="mt-2 flex items-center gap-2">
          <span 
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: template.primaryColor }}
          />
          <span className="text-xs text-muted-foreground capitalize">{template.category}</span>
        </div>
      </div>
    </div>
  );
}
