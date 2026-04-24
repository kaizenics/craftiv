"use client";

import { getCoverLetterTemplate } from "@/lib/cover-letter-templates";
import { CoverLetterData } from "@/lib/types/cover-letter";
import { cn } from "@/lib/utils";
import DOMPurify from "isomorphic-dompurify";

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function plainTextToHtml(plain: string) {
  return escapeHtml(plain).replaceAll(/\r?\n/g, "<br/>");
}

function normalizeBodyHtml(stored: string) {
  const trimmed = stored?.trim() ?? "";
  if (!trimmed) return "";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
  return plainTextToHtml(trimmed);
}

interface CoverLetterPreviewProps {
  data: CoverLetterData;
  className?: string;
}

export function CoverLetterPreview({ data, className }: CoverLetterPreviewProps) {
  const { contact, employer, content, date } = data;
  const template = getCoverLetterTemplate(data.templateId);
  const isModernAts = template.id === "modern-ats";
  const isProfessional = template.id === "professional";
  const isExecutive = template.id === "executive";
  const isMinimalSerif = template.id === "minimal-serif";
  const isCleanBlock = template.id === "clean-block";
  const isSidebarContact = template.id === "sidebar-contact";
  const isElegantLine = template.id === "elegant-line";
  const accentColor = template.accentColor ?? "#18181b";
  const hasName = contact.firstName || contact.lastName;
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  const sanitizedContent = DOMPurify.sanitize(normalizeBodyHtml(content || ""), {
    USE_PROFILES: { html: true },
  });
  const contentPlainLength = sanitizedContent
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim().length;
  const isLongContent = contentPlainLength > 1100;
  const isVeryLongContent = contentPlainLength > 1500;

  const previewFontSize = isVeryLongContent
    ? "clamp(9.5px, 1.15vw, 12px)"
    : isLongContent
      ? "clamp(10px, 1.25vw, 13px)"
      : "clamp(10.5px, 1.4vw, 14px)";

  const previewLineHeight = isVeryLongContent ? "1.45" : isLongContent ? "1.55" : "1.62";
  const previewPadding = isVeryLongContent
    ? "6.5% 8.5% 8% 8.5%"
    : isLongContent
      ? "7% 9% 8.5% 9%"
      : "8% 10% 10% 10%";
  const wrapperPadding = isSidebarContact
    ? isVeryLongContent
      ? "0"
      : "0"
    : previewPadding;
  const previewFontFamily = isModernAts || isExecutive || isCleanBlock || isSidebarContact
    ? "'Helvetica Neue', Arial, sans-serif"
    : "Georgia, 'Times New Roman', serif";
  const baseTextColor = isModernAts || isExecutive || isCleanBlock || isSidebarContact
    ? "text-zinc-900"
    : "text-zinc-800";
  const metaTone = isMinimalSerif || isProfessional ? "text-zinc-500" : "text-zinc-600";

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[640px] overflow-hidden rounded-sm bg-white shadow-lg",
        (isModernAts || isCleanBlock || isSidebarContact || isExecutive || isElegantLine)
          ? "border border-zinc-200"
          : "",
        baseTextColor,
        className
      )}
      style={{
        aspectRatio: "210 / 297",
        padding: wrapperPadding,
        fontFamily: previewFontFamily,
        fontSize: previewFontSize,
        lineHeight: previewLineHeight,
      }}
    >
      <div
        className={cn(
          "h-full",
          isSidebarContact ? "grid grid-cols-[30%_70%]" : ""
        )}
      >
        {isSidebarContact && (
          <aside
            className="flex h-full flex-col justify-between p-[9%] text-white"
            style={{ backgroundColor: accentColor }}
          >
            <div>
              <p className="text-[9pt] uppercase tracking-[0.28em] text-white/70">Contact</p>
              {hasName && <p className="mt-4 text-[14pt] font-semibold leading-tight">{fullName}</p>}
              {contact.email && <p className="mt-5 text-[9pt] break-words">{contact.email}</p>}
              {contact.phone && <p className="mt-2 text-[9pt]">{contact.phone}</p>}
              {(contact.address || contact.city) && (
                <p className="mt-2 text-[9pt] text-white/80">
                  {[contact.address, contact.city].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
            <div className="text-[8.7pt] text-white/75">
              {date && <p>{date}</p>}
            </div>
          </aside>
        )}

        <div className={cn(isSidebarContact ? "p-[8.5%]" : "")}>
          {isModernAts && <div className="mb-4 h-1 w-20 rounded-full bg-zinc-800" />}
          {isCleanBlock && (
            <div className="mb-5 rounded-sm border px-4 py-3" style={{ borderColor: `${accentColor}30`, backgroundColor: `${accentColor}08` }}>
              {hasName && <p className="text-[13pt] font-semibold">{fullName}</p>}
              <div className={cn("mt-1 space-y-0.5 text-[9pt]", metaTone)}>
                {(contact.address || contact.city) && <p>{[contact.address, contact.city].filter(Boolean).join(", ")}</p>}
                {(contact.phone || contact.email) && <p>{[contact.phone, contact.email].filter(Boolean).join("  |  ")}</p>}
              </div>
            </div>
          )}

          {!isCleanBlock && !isSidebarContact && hasName && (
            <div className="mb-1">
              <p
                className={cn(
                  "text-[12.5pt]",
                  isModernAts || isExecutive ? "font-semibold tracking-tight" : "font-bold tracking-wide"
                )}
                style={isExecutive || isElegantLine ? { color: accentColor } : undefined}
              >
                {fullName}
              </p>
            </div>
          )}

          {!isCleanBlock && !isSidebarContact && (
            <div className={cn("space-y-0.5 text-[9pt]", metaTone)}>
              {(contact.address || contact.city) && (
                <p>{[contact.address, contact.city].filter(Boolean).join(", ")}</p>
              )}
              {(contact.phone || contact.email) && (
                <p>{[contact.phone, contact.email].filter(Boolean).join("  |  ")}</p>
              )}
            </div>
          )}

          {date && !isSidebarContact && (
            <p
              className={cn(
                "mt-5 text-[9.2pt]",
                isModernAts || isExecutive || isCleanBlock ? "font-medium text-zinc-700" : "text-zinc-600"
              )}
            >
              {date}
            </p>
          )}

          {(employer.hiringManagerName || employer.companyName || employer.companyAddress || employer.jobTitle) && (
            <div
              className={cn(
                "mt-4 space-y-0.5 text-[9.2pt]",
                isExecutive ? "border-l-2 pl-3" : "",
                isElegantLine ? "border-t pt-3" : ""
              )}
              style={
                isExecutive || isElegantLine
                  ? { borderColor: `${accentColor}55` }
                  : undefined
              }
            >
              {employer.hiringManagerName && (
                <p className={cn(isModernAts || isExecutive || isCleanBlock ? "font-medium text-zinc-800" : "font-medium")}>
                  {employer.hiringManagerName}
                </p>
              )}
              {employer.jobTitle && <p className="text-zinc-500">{employer.jobTitle}</p>}
              {employer.companyName && (
                <p className={cn(isModernAts || isCleanBlock || isExecutive ? "font-semibold" : "font-medium")}>
                  {employer.companyName}
                </p>
              )}
              {employer.companyAddress && <p className="text-zinc-500">{employer.companyAddress}</p>}
            </div>
          )}

          {sanitizedContent ? (
            <div
              className={cn(
                "mt-6 wrap-break-word text-left [word-spacing:normal]",
                isModernAts || isExecutive || isCleanBlock || isSidebarContact ? "tracking-tight text-zinc-800" : "tracking-normal",
                isVeryLongContent
                  ? "[&_p]:mb-2 [&_ul]:my-2 [&_ol]:my-2"
                  : isLongContent
                    ? "[&_p]:mb-2.5 [&_ul]:my-2.5 [&_ol]:my-2.5"
                    : "[&_p]:mb-3 [&_ul]:my-3 [&_ol]:my-3",
                isMinimalSerif ? "[&_p]:text-zinc-700" : "",
                "[&_p:last-child]:mb-0 [&_li]:mb-1"
              )}
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          ) : (
            <p className="mt-6 text-[9.5pt] italic text-zinc-400">
              Your cover letter content will appear here...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
