"use client";

import { CoverLetterData } from "@/lib/types/cover-letter";
import { cn } from "@/lib/utils";

interface CoverLetterPreviewProps {
  data: CoverLetterData;
  className?: string;
}

export function CoverLetterPreview({ data, className }: CoverLetterPreviewProps) {
  const { contact, employer, opening, body, closing, date } = data;
  const hasName = contact.firstName || contact.lastName;
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[640px] bg-white text-zinc-800 shadow-lg rounded-sm",
        className
      )}
      style={{
        aspectRatio: "210 / 297",
        padding: "8% 10% 10% 10%",
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: "clamp(11px, 1.5vw, 15px)",
        lineHeight: "1.65",
      }}
    >
      {/* Sender info */}
      {hasName && (
        <div className="mb-1">
          <p className="text-[14pt] font-bold tracking-wide">{fullName}</p>
        </div>
      )}
      <div className="text-[9.5pt] text-zinc-500 space-y-0.5">
        {(contact.address || contact.city) && (
          <p>{[contact.address, contact.city].filter(Boolean).join(", ")}</p>
        )}
        {(contact.phone || contact.email) && (
          <p>{[contact.phone, contact.email].filter(Boolean).join("  |  ")}</p>
        )}
      </div>

      {/* Date */}
      {date && <p className="mt-6 text-[10pt] text-zinc-600">{date}</p>}

      {/* Recipient info */}
      {(employer.hiringManagerName || employer.companyName || employer.companyAddress || employer.jobTitle) && (
        <div className="mt-5 text-[10pt] space-y-0.5">
          {employer.hiringManagerName && <p>{employer.hiringManagerName}</p>}
          {employer.jobTitle && <p className="text-zinc-500">{employer.jobTitle}</p>}
          {employer.companyName && <p className="font-medium">{employer.companyName}</p>}
          {employer.companyAddress && <p className="text-zinc-500">{employer.companyAddress}</p>}
        </div>
      )}

      {/* Greeting */}
      <p className="mt-8 font-medium">
        {employer.hiringManagerName
          ? `Dear ${employer.hiringManagerName},`
          : "Dear Hiring Manager,"}
      </p>

      {/* Opening paragraph */}
      {opening ? (
        <p className="mt-4 text-justify">{opening}</p>
      ) : (
        <p className="mt-4 text-zinc-300 italic text-[10pt]">
          Your opening paragraph will appear here...
        </p>
      )}

      {/* Body */}
      {body ? (
        <div className="mt-4 text-justify whitespace-pre-wrap">{body}</div>
      ) : (
        <p className="mt-4 text-zinc-300 italic text-[10pt]">
          The main body of your letter will appear here...
        </p>
      )}

      {/* Closing */}
      {closing ? (
        <p className="mt-4 text-justify">{closing}</p>
      ) : (
        <p className="mt-4 text-zinc-300 italic text-[10pt]">
          Your closing paragraph will appear here...
        </p>
      )}

      {/* Sign-off */}
      <div className="mt-8">
        <p>Sincerely,</p>
        {hasName && <p className="mt-4 font-medium">{fullName}</p>}
      </div>
    </div>
  );
}
