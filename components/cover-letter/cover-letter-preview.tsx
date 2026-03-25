"use client";

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

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[640px] overflow-hidden rounded-sm bg-white text-zinc-800 shadow-lg",
        className
      )}
      style={{
        aspectRatio: "210 / 297",
        padding: previewPadding,
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: previewFontSize,
        lineHeight: previewLineHeight,
      }}
    >
      {/* Sender info */}
      {hasName && (
        <div className="mb-1">
          <p className="text-[12.5pt] font-bold tracking-wide">{fullName}</p>
        </div>
      )}
      <div className="space-y-0.5 text-[9pt] text-zinc-500">
        {(contact.address || contact.city) && (
          <p>{[contact.address, contact.city].filter(Boolean).join(", ")}</p>
        )}
        {(contact.phone || contact.email) && (
          <p>{[contact.phone, contact.email].filter(Boolean).join("  |  ")}</p>
        )}
      </div>

      {/* Date */}
      {date && <p className="mt-5 text-[9.2pt] text-zinc-600">{date}</p>}

      {/* Recipient info */}
      {(employer.hiringManagerName || employer.companyName || employer.companyAddress || employer.jobTitle) && (
        <div className="mt-4 space-y-0.5 text-[9.2pt]">
          {employer.hiringManagerName && <p>{employer.hiringManagerName}</p>}
          {employer.jobTitle && <p className="text-zinc-500">{employer.jobTitle}</p>}
          {employer.companyName && <p className="font-medium">{employer.companyName}</p>}
          {employer.companyAddress && <p className="text-zinc-500">{employer.companyAddress}</p>}
        </div>
      )}

      {/* Letter content (single WYSIWYG source) */}
      {sanitizedContent ? (
        <div
          className={cn(
            "mt-6 wrap-break-word text-left [word-spacing:normal] tracking-normal",
            isVeryLongContent
              ? "[&_p]:mb-2 [&_ul]:my-2 [&_ol]:my-2"
              : isLongContent
                ? "[&_p]:mb-2.5 [&_ul]:my-2.5 [&_ol]:my-2.5"
                : "[&_p]:mb-3 [&_ul]:my-3 [&_ol]:my-3",
            "[&_p:last-child]:mb-0 [&_li]:mb-1"
          )}
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      ) : (
        <p className="mt-6 text-[9.5pt] italic text-zinc-300">
          Your cover letter content will appear here...
        </p>
      )}
    </div>
  );
}
