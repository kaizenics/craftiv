'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ResumeData } from '@/lib/types/resume';
import { resumeTemplates } from '@/lib/resume-templates';
import { ResumePreview } from '@/components/resume/resume-preview';
import { Download, FileText, File } from '@/components/ui/icons';
import { 
  generatePDF, 
  generateDOCX, 
  type DesignOptions, 
  defaultDesignOptions 
} from '@/lib/resume-generator';

interface DownloadDialogProps {
  data: ResumeData;
  isOpen: boolean;
  onClose: () => void;
  designOptions?: DesignOptions;
  customFileName?: string;
  customColor?: string;
  showPhoto?: boolean;
  onDownloadComplete?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

type DownloadFormat = 'pdf' | 'docx';

export function DownloadDialog({
  data,
  isOpen,
  onClose,
  designOptions = defaultDesignOptions,
  customFileName,
  customColor,
  showPhoto = false,
  onDownloadComplete,
  secondaryActionLabel = 'Cancel',
  onSecondaryAction,
}: DownloadDialogProps) {
  const [format, setFormat] = useState<DownloadFormat>('pdf');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);

  const template = resumeTemplates.find((t) => t.id === data.templateId) || resumeTemplates[0];
  const fileName = customFileName || `${data.contact.firstName || 'Resume'}_${data.contact.lastName || 'CV'}`;

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      if (format === 'pdf') {
        // Small delay to ensure UI updates before heavy operation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await generatePDF({
          data,
          template,
          fileName,
          designOptions,
          customColor
        });
      } else {
        await generateDOCX({
          data,
          template,
          fileName,
          designOptions,
          customColor
        });
      }
      setDownloadComplete(true);
      
      // Call the completion callback
      if (onDownloadComplete) {
        onDownloadComplete();
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to generate resume. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Pre-render the resume when dialog opens for faster PDF generation
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure dialog is fully rendered first
      setTimeout(() => {
        const previewElement = document.querySelector('[data-resume-export-preview] [data-resume-preview]');
        if (previewElement) {
          // Force a layout recalculation to ensure everything is ready
          void previewElement.getBoundingClientRect();
        }
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden resume preview for export generation - pre-rendered with all pages */}
      {isOpen && (
        <div 
          data-resume-export-preview
          style={{ 
            position: 'fixed', 
            left: '-10000px', 
            top: 0, 
            width: '210mm',
            height: 'auto',
            overflow: 'visible',
            visibility: 'visible'
          }}
        >
          <ResumePreview
            data={data}
            designOptions={designOptions}
            customColor={customColor}
            showPhoto={showPhoto}
            showScore={false}
            showFooter={false}
            plain
            renderAllPages={true}
          />
        </div>
      )}
      
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Download className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Download Your Resume</DialogTitle>
          <DialogDescription className="text-center">
            Choose your preferred format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Label className="text-sm font-medium">Select Format</Label>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormat('pdf')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                format === 'pdf'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <FileText className={`h-8 w-8 ${format === 'pdf' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="font-medium">PDF</span>
              <span className="text-xs text-muted-foreground">Best for sharing</span>
            </button>

            <button
              onClick={() => setFormat('docx')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                format === 'docx'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <File className={`h-8 w-8 ${format === 'docx' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="font-medium">DOCX</span>
              <span className="text-xs text-muted-foreground">Easy to edit</span>
            </button>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium mb-1">File: {fileName}.{format}</p>
            <p className="text-muted-foreground text-xs">
              Template: {template.name}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onSecondaryAction ?? onClose} className="flex-1">
              {secondaryActionLabel}
            </Button>
            <Button onClick={handleDownload} disabled={isDownloading} className="flex-1">
              {isDownloading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Downloading...
                </>
              ) : downloadComplete ? (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Again
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download {format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
