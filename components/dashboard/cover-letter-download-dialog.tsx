"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Download, FileText, File } from "@/components/ui/icons";
import { getCoverLetterTemplate } from "@/lib/cover-letter-templates";
import type { CoverLetterData } from "@/lib/types/cover-letter";

type CoverLetterDownloadFormat = "pdf" | "docx" | "txt";

interface CoverLetterDownloadDialogProps {
  data: CoverLetterData;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function plainToHtmlParagraphs(value: string) {
  return value
    .split(/\r?\n\s*\r?\n/)
    .map((p) => `<p>${escapeHtml(p).replaceAll(/\r?\n/g, "<br/>")}</p>`)
    .join("");
}

function toSafeFileName(value: string) {
  return (value || "cover-letter")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
}

function toPdfContentHtml(value: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  }
  return plainToHtmlParagraphs(trimmed);
}

function stripHtmlToPlain(value: string) {
  return (value || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildCoverLetterPdfHtml(data: CoverLetterData) {
  const { contact, employer, date, content } = data;
  const template = getCoverLetterTemplate(data.templateId);
  const isModernAts = template.id === "modern-ats";
  const isExecutive = template.id === "executive";
  const isCleanBlock = template.id === "clean-block";
  const isSidebarContact = template.id === "sidebar-contact";
  const isElegantLine = template.id === "elegant-line";
  const isSansTemplate =
    isModernAts || isExecutive || isCleanBlock || isSidebarContact;
  const accentColor = template.accentColor ?? "#18181b";
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  const bodyHtml = toPdfContentHtml(content);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: A4; margin: 0; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        font-family: ${isSansTemplate
          ? '"Helvetica Neue", Arial, sans-serif'
          : 'Georgia, "Times New Roman", serif'};
        color: ${isSansTemplate ? "#18181b" : "#27272a"};
        background: #ffffff;
      }
      .page {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        padding: ${isSidebarContact ? "0" : isModernAts || isCleanBlock ? "16mm 18mm 18mm 18mm" : "18mm 20mm 20mm 20mm"};
        line-height: ${isSansTemplate ? "1.55" : "1.6"};
        font-size: 12px;
      }
      .layout-sidebar {
        display: grid;
        grid-template-columns: 33% 67%;
        min-height: 297mm;
      }
      .sidebar {
        background: ${accentColor};
        color: #ffffff;
        padding: 18mm 12mm;
      }
      .sidebar-label {
        margin: 0;
        font-size: 9px;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        color: rgba(255,255,255,0.72);
      }
      .sidebar-name {
        margin: 12px 0 0;
        font-size: 18px;
        font-weight: 600;
        line-height: 1.2;
      }
      .sidebar-meta {
        margin: 10px 0 0;
        font-size: 11px;
        color: rgba(255,255,255,0.88);
      }
      .main {
        padding: 18mm 18mm 18mm 16mm;
      }
      .accent {
        width: 58px;
        height: 4px;
        border-radius: 999px;
        background: #18181b;
        margin-bottom: 14px;
      }
      .top-card {
        margin-bottom: 16px;
        padding: 10px 12px;
        border: 1px solid ${accentColor}33;
        background: ${accentColor}10;
      }
      .name {
        font-size: ${isModernAts || isExecutive ? "18px" : "20px"};
        font-weight: ${isModernAts || isExecutive ? "600" : "700"};
        margin: 0 0 6px;
        color: ${isExecutive || isElegantLine ? accentColor : "inherit"};
      }
      .meta { margin: 0; color: ${isSansTemplate ? "#3f3f46" : "#52525b"}; }
      .section { margin-top: 18px; }
      .recipient-box {
        border-left: ${isExecutive ? `2px solid ${accentColor}` : "0"};
        border-top: ${isElegantLine ? `1px solid ${accentColor}66` : "0"};
        padding-left: ${isExecutive ? "10px" : "0"};
        padding-top: ${isElegantLine ? "10px" : "0"};
      }
      .recipient-name {
        margin: 0;
        font-weight: ${isModernAts || isExecutive || isCleanBlock ? "600" : "400"};
      }
      .recipient-job { margin: 0; color: #52525b; }
      .recipient-company {
        margin: 0;
        font-weight: ${isModernAts || isExecutive || isCleanBlock ? "600" : "500"};
      }
      .recipient-address { margin: 0; color: #52525b; }
      .body p { margin: 0 0 14px; }
      .body p:last-child { margin-bottom: 0; }
      .body ul, .body ol { margin: 0 0 14px 20px; }
    </style>
  </head>
  <body>
    <div class="page ${isSidebarContact ? "layout-sidebar" : ""}">
      ${isSidebarContact ? `
        <div class="sidebar">
          <p class="sidebar-label">Contact</p>
          ${fullName ? `<p class="sidebar-name">${escapeHtml(fullName)}</p>` : ""}
          ${contact.email ? `<p class="sidebar-meta">${escapeHtml(contact.email)}</p>` : ""}
          ${contact.phone ? `<p class="sidebar-meta">${escapeHtml(contact.phone)}</p>` : ""}
          ${(contact.address || contact.city)
            ? `<p class="sidebar-meta">${escapeHtml([contact.address, contact.city].filter(Boolean).join(", "))}</p>`
            : ""}
          ${date ? `<p class="sidebar-meta" style="margin-top: 24px;">${escapeHtml(date)}</p>` : ""}
        </div>
        <div class="main">
      ` : ""}
      ${isModernAts ? `<div class="accent"></div>` : ""}
      ${isCleanBlock ? `
        <div class="top-card">
          ${fullName ? `<p class="name">${escapeHtml(fullName)}</p>` : ""}
          ${(contact.address || contact.city)
            ? `<p class="meta">${escapeHtml([contact.address, contact.city].filter(Boolean).join(", "))}</p>`
            : ""}
          ${(contact.phone || contact.email)
            ? `<p class="meta">${escapeHtml([contact.phone, contact.email].filter(Boolean).join(" | "))}</p>`
            : ""}
        </div>
      ` : `
        ${fullName ? `<p class="name">${escapeHtml(fullName)}</p>` : ""}
        ${(contact.address || contact.city)
          ? `<p class="meta">${escapeHtml([contact.address, contact.city].filter(Boolean).join(", "))}</p>`
          : ""}
        ${(contact.phone || contact.email)
          ? `<p class="meta">${escapeHtml([contact.phone, contact.email].filter(Boolean).join(" | "))}</p>`
          : ""}
      `}

      ${date && !isSidebarContact ? `<p class="section">${escapeHtml(date)}</p>` : ""}

      ${(employer.hiringManagerName || employer.jobTitle || employer.companyName || employer.companyAddress)
        ? `<div class="section recipient-box">
            ${employer.hiringManagerName ? `<p class="recipient-name">${escapeHtml(employer.hiringManagerName)}</p>` : ""}
            ${employer.jobTitle ? `<p class="recipient-job">${escapeHtml(employer.jobTitle)}</p>` : ""}
            ${employer.companyName ? `<p class="recipient-company">${escapeHtml(employer.companyName)}</p>` : ""}
            ${employer.companyAddress ? `<p class="recipient-address">${escapeHtml(employer.companyAddress)}</p>` : ""}
           </div>`
        : ""}

      <div class="section body">
        ${bodyHtml}
      </div>
      ${isSidebarContact ? `</div>` : ""}
    </div>
  </body>
</html>`;
}

export function CoverLetterDownloadDialog({
  data,
  fileName,
  isOpen,
  onClose,
}: CoverLetterDownloadDialogProps) {
  const [format, setFormat] = useState<CoverLetterDownloadFormat>("pdf");
  const [isDownloading, setIsDownloading] = useState(false);

  const safeFileName = useMemo(() => toSafeFileName(fileName), [fileName]);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      if (format === "pdf") {
        const html = buildCoverLetterPdfHtml(data);
        const response = await fetch("/api/cover-letter/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html, fileName: safeFileName }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || "Failed to generate PDF");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${safeFileName || "cover-letter"}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } else if (format === "docx") {
        const wordHtml = buildCoverLetterPdfHtml(data);
        const blob = new Blob([wordHtml], {
          type: "application/msword",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${safeFileName || "cover-letter"}.docx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } else {
        const plainBody = stripHtmlToPlain(data.content);
        const lines = [
          `${data.contact.firstName} ${data.contact.lastName}`.trim(),
          [data.contact.address, data.contact.city].filter(Boolean).join(", "),
          [data.contact.phone, data.contact.email].filter(Boolean).join(" | "),
          "",
          data.date || "",
          "",
          data.employer.hiringManagerName || "",
          data.employer.jobTitle || "",
          data.employer.companyName || "",
          data.employer.companyAddress || "",
          "",
          plainBody,
        ]
          .filter((line, index, arr) => {
            if (line) return true;
            return !(arr[index - 1] === "" && arr[index + 1] === "");
          })
          .join("\n");

        const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${safeFileName || "cover-letter"}.txt`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }

      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not download cover letter.";
      alert(message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-4 flex justify-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Download className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Download Cover Letter</DialogTitle>
          <DialogDescription className="text-center">Choose your preferred format</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setFormat("pdf")}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                format === "pdf" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <FileText className={`h-8 w-8 ${format === "pdf" ? "text-primary" : "text-muted-foreground"}`} />
              <span className="font-medium">PDF</span>
              <span className="text-xs text-muted-foreground">Best for sharing</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat("docx")}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                format === "docx" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <File className={`h-8 w-8 ${format === "docx" ? "text-primary" : "text-muted-foreground"}`} />
              <span className="font-medium">DOCX</span>
              <span className="text-xs text-muted-foreground">Easy to edit</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat("txt")}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                format === "txt" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <File className={`h-8 w-8 ${format === "txt" ? "text-primary" : "text-muted-foreground"}`} />
              <span className="font-medium">TXT</span>
              <span className="text-xs text-muted-foreground">Plain text</span>
            </button>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="mb-1 font-medium">
              File: {safeFileName}.{format}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={() => void handleDownload()} disabled={isDownloading} className="flex-1">
              {isDownloading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Downloading...
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
  );
}
