"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ResumePreview } from "@/components/resume/resume-preview";
import { createSampleResumeForTemplate } from "@/lib/data/templates";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  ZoomIn,
  ZoomOut,
} from "@/components/ui/icons";

const A4_WIDTH_PX = (210 / 25.4) * 96;
const A4_HEIGHT_PX = (297 / 25.4) * 96;
const VIEWPORT_PADDING_PX = 32;
const MIN_ZOOM = 1;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;

interface TemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
  templateDescription?: string;
  color: string;
  showPhoto?: boolean;
  onUseTemplate?: (templateId: string) => void;
}

export function TemplatePreviewDialog({
  open,
  onOpenChange,
  ...previewProps
}: TemplatePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[95vh] max-h-[95vh] w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-5xl">
        {/* Mounted only while open, so zoom and page reset on every open. */}
        <TemplatePreviewContent {...previewProps} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

type TemplatePreviewContentProps = Omit<
  TemplatePreviewDialogProps,
  "open" | "onOpenChange"
> & { onClose: () => void };

function TemplatePreviewContent({
  templateId,
  templateName,
  templateDescription,
  color,
  showPhoto = false,
  onUseTemplate,
  onClose,
}: TemplatePreviewContentProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.6);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);

  const sampleData = useMemo(
    () => createSampleResumeForTemplate(templateId, showPhoto),
    [templateId, showPhoto]
  );

  // Scale the A4 page so a full page fits the viewport at 100% zoom.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(() => {
      const width = viewport.clientWidth;
      const height = viewport.clientHeight;
      if (!width || !height) return;

      const nextScale = Math.min(
        (width - VIEWPORT_PADDING_PX) / A4_WIDTH_PX,
        (height - VIEWPORT_PADDING_PX) / A4_HEIGHT_PX
      );
      setFitScale(Math.max(0.15, nextScale));
    });
    observer.observe(viewport);

    return () => observer.disconnect();
  }, []);

  // ResumePreview lays the document out as one continuous flow and clips it to a
  // single A4 page, so the height of that flow tells us how many pages there are.
  useEffect(() => {
    const content = pageRef.current?.querySelector<HTMLElement>("[data-pdf-content]");
    if (!content) return;

    const observer = new ResizeObserver(() => {
      const next = Math.max(1, Math.round(content.scrollHeight / A4_HEIGHT_PX));
      setPageCount(next);
      setPage((current) => Math.min(current, next));
    });
    observer.observe(content);

    return () => observer.disconnect();
  }, []);

  const scale = fitScale * zoom;

  return (
    <>
      <DialogHeader className="flex-row items-center justify-between gap-3 border-b border-zinc-100 py-3 pl-4 pr-14 sm:pl-6 sm:pr-16">
        <div className="min-w-0">
          <DialogTitle className="truncate font-display text-base font-semibold text-zinc-900">
            {templateName}
          </DialogTitle>
          <DialogDescription className="mt-1 truncate text-xs text-zinc-500">
            {templateDescription ?? "Full preview with sample content"}
          </DialogDescription>
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-full border border-zinc-200 bg-white p-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-10 text-center text-xs font-medium tabular-nums text-zinc-600">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </DialogHeader>

      {/* Preview viewport */}
      <div ref={viewportRef} className="min-h-0 flex-1 overflow-auto bg-zinc-100">
        <div className="flex min-h-full w-fit min-w-full items-center justify-center p-4">
          <div
            ref={pageRef}
            className="shrink-0 overflow-hidden rounded-sm bg-white shadow-lg"
            style={{
              width: `${A4_WIDTH_PX * scale}px`,
              height: `${A4_HEIGHT_PX * scale}px`,
            }}
          >
            <div
              style={{
                width: `${A4_WIDTH_PX}px`,
                height: `${A4_HEIGHT_PX}px`,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <ResumePreview
                data={sampleData}
                customColor={color}
                showPhoto={showPhoto}
                showScore={false}
                showFooter={false}
                currentPage={page}
                onPageChange={setPage}
                plain
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3 sm:px-6">
        {pageCount > 1 ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="whitespace-nowrap text-xs font-medium tabular-nums text-zinc-600">
              <span className="hidden sm:inline">Page </span>
              {page} / {pageCount}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <span className="text-xs text-zinc-500">Sample content shown</span>
        )}

        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden sm:inline-flex" onClick={onClose}>
            Close
          </Button>
          {onUseTemplate && (
            <Button
              onClick={() => {
                onClose();
                onUseTemplate(templateId);
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Use this template
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
