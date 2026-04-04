"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CoverLetterPreview } from "@/components/cover-letter/cover-letter-preview";
import {
  ContactForm,
  EmployerForm,
  LetterBodyForm,
} from "@/components/cover-letter/forms";
import {
  getCoverLetterTemplate,
  normalizeCoverLetterTemplateId,
} from "@/lib/cover-letter-templates";
import {
  CoverLetterData,
  createEmptyCoverLetterData,
  normalizeCoverLetterData,
} from "@/lib/types/cover-letter";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Sparkles,
  Eye,
  EyeOff,
  PenLine,
  ChevronRight,
  Upload,
  FileText,
  FileUp,
  X,
  Loader2,
  AlertCircle,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

type DialogView = "pick" | "upload";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];
const MAX_SIZE = 10 * 1024 * 1024;

function WriteCoverLetterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverLetterId = searchParams.get("id");
  const selectedTemplateId = normalizeCoverLetterTemplateId(searchParams.get("template"));
  const isEditing = Boolean(coverLetterId);

  // Dialog state
  const [methodDialogOpen, setMethodDialogOpen] = useState(true);
  const [dialogView, setDialogView] = useState<DialogView>("pick");

  // Upload state (inside dialog)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");
  const [uploadError, setUploadError] = useState("");

  // Editor state
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData>(
    createEmptyCoverLetterData()
  );
  const [showPreview, setShowPreview] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inlineGenerateError, setInlineGenerateError] = useState("");
  const [isInlineGenerating, setIsInlineGenerating] = useState(false);
  const [finishError, setFinishError] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const utils = trpc.useUtils();
  const coverLetterQuery = trpc.coverLetter.getById.useQuery(
    { id: coverLetterId! },
    { enabled: !!coverLetterId }
  );
  const saveCoverLetter = trpc.coverLetter.create.useMutation({
    onSuccess: () => {
      utils.coverLetter.list.invalidate();
    },
  });
  const updateCoverLetter = trpc.coverLetter.update.useMutation({
    onSuccess: () => {
      utils.coverLetter.list.invalidate();
      if (coverLetterId) {
        utils.coverLetter.getById.invalidate({ id: coverLetterId });
      }
    },
  });

  useEffect(() => {
    if (isLoading || session) return;

    const qs = searchParams.toString();
    const redirectPath = `/cover-letter/write${qs ? `?${qs}` : ""}`;
    router.replace(`/sign-in?redirect=${encodeURIComponent(redirectPath)}`);
  }, [isLoading, session, router, searchParams]);

  useEffect(() => {
    if (isEditing) {
      setMethodDialogOpen(false);
      return;
    }

    setMethodDialogOpen(true);
    setDialogView("pick");
  }, [isEditing]);

  useEffect(() => {
    if (!coverLetterQuery.data) return;

    setCoverLetterData(normalizeCoverLetterData(coverLetterQuery.data.data));
    setMethodDialogOpen(false);
    setDialogView("pick");
  }, [coverLetterQuery.data]);

  useEffect(() => {
    if (isEditing) return;

    setCoverLetterData((prev) =>
      prev.templateId === selectedTemplateId
        ? prev
        : {
            ...prev,
            templateId: selectedTemplateId,
          }
    );
  }, [isEditing, selectedTemplateId]);

  // ── Upload helpers ──────────────────────────────────────────────────────

  const validateFile = (file: File): string | null => {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!ACCEPTED_EXTENSIONS.includes(ext)) return "Only PDF and DOCX files are accepted.";
    if (file.size > MAX_SIZE) return "File size must be under 10MB.";
    return null;
  };

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }
    setSelectedFile(file);
    setUploadError("");
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) handleFile(e.target.files[0]);
    },
    [handleFile]
  );

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const escapeHtml = (text: string) =>
    text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const plainToHtmlParagraphs = (text: string) => {
    const normalized = text.replaceAll("\r", "").trim();
    if (!normalized) return "";

    // 1) Respect explicit paragraph breaks first.
    let paragraphs = normalized
      .split(/\n{2,}/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (paragraphs.length <= 1) {
      // 2) If AI returns single-line output, infer natural paragraph boundaries.
      const compact = normalized
        .replace(/\s+(Best regards,|Kind regards,|Regards,|Sincerely,)/gi, "\n\n$1")
        .replace(/\s+(Thank you for your (time|consideration)\.)/gi, "\n\n$1");

      paragraphs = compact
        .split(/\n{2,}/)
        .map((segment) => segment.trim())
        .filter(Boolean);
    }

    if (paragraphs.length <= 1) {
      // 3) Final fallback: split by sentences into 3-4 readable blocks.
      const sentences = normalized
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (sentences.length >= 4) {
        const chunkCount = Math.min(4, Math.max(3, Math.ceil(sentences.length / 2)));
        const chunkSize = Math.ceil(sentences.length / chunkCount);
        const chunks: string[] = [];
        for (let i = 0; i < sentences.length; i += chunkSize) {
          chunks.push(sentences.slice(i, i + chunkSize).join(" "));
        }
        paragraphs = chunks;
      } else {
        paragraphs = [normalized];
      }
    }

    return paragraphs
      .map((segment) => `<p>${escapeHtml(segment).replaceAll(/\n/g, "<br/>")}</p>`)
      .join("");
  };

  // ── Generate from resume ───────────────────────────────────────────────

  const handleGenerateFromResume = async () => {
    if (!selectedFile) return;

    setIsGenerating(true);
    setUploadError("");

    try {
      setProgressLabel("Scanning your resume...");
      const formData = new FormData();
      formData.append("file", selectedFile);

      const parseRes = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });

      if (!parseRes.ok) {
        const err = await parseRes.json();
        throw new Error(err.error || "Failed to parse resume");
      }

      const { data: resumeData } = await parseRes.json();

      setProgressLabel("AI is writing your cover letter...");

      const resumeTextParts: string[] = [];
      if (resumeData.summary) resumeTextParts.push(`Summary: ${resumeData.summary}`);
      const c = resumeData.contact || {};
      if (c.firstName || c.lastName)
        resumeTextParts.push(`Name: ${c.firstName} ${c.lastName}`.trim());
      if (c.desiredJobTitle)
        resumeTextParts.push(`Job Title: ${c.desiredJobTitle}`);
      for (const exp of resumeData.experiences || []) {
        if (exp.jobTitle || exp.employer) {
          let line = `${exp.jobTitle} at ${exp.employer}`;
          if (exp.description) line += `\n${exp.description}`;
          resumeTextParts.push(line);
        }
      }
      for (const edu of resumeData.educations || []) {
        if (edu.degree || edu.schoolName)
          resumeTextParts.push(`${edu.degree} — ${edu.schoolName}`);
      }
      const skillNames = (resumeData.skills || [])
        .map((s: { name?: string }) => s.name)
        .filter(Boolean);
      if (skillNames.length > 0)
        resumeTextParts.push(`Skills: ${skillNames.join(", ")}`);

      const resumeText = resumeTextParts.join("\n\n");

      const genRes = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      });

      if (!genRes.ok) {
        const err = await genRes.json();
        throw new Error(err.error || "Failed to generate cover letter");
      }

      const generated = await genRes.json();

      const generatedContent = generated.content
        ? plainToHtmlParagraphs(generated.content)
        : [generated.opening, generated.body, generated.closing]
            .filter(Boolean)
            .map((text: string) => `<p>${escapeHtml(text)}</p>`)
            .join("");

      setCoverLetterData((prev) => ({
        contact: {
          firstName: c.firstName || "",
          lastName: c.lastName || "",
          email: c.email || "",
          phone: c.phone || "",
          address: "",
          city: "",
        },
        employer: {
          hiringManagerName: "",
          companyName: "",
          companyAddress: "",
          jobTitle: "",
        },
        content: generatedContent || "",
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        templateId: prev.templateId,
      }));

      setMethodDialogOpen(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setUploadError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInlineGenerateWithAI = async () => {
    const jobTitle = coverLetterData.employer.jobTitle.trim();
    if (!jobTitle) {
      setInlineGenerateError("Please enter a Job Title in Employer section first.");
      return;
    }

    setInlineGenerateError("");
    setIsInlineGenerating(true);

    try {
      const { contact, employer, content } = coverLetterData;
      const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");

      const currentDraftText = (() => {
        if (!content) return "";
        const tmp = document.createElement("div");
        tmp.innerHTML = content;
        return (tmp.innerText || tmp.textContent || "").trim();
      })();

      const contextParts = [
        `Target Job Title: ${jobTitle}`,
        fullName ? `Candidate Name: ${fullName}` : "",
        contact.email ? `Email: ${contact.email}` : "",
        contact.phone ? `Phone: ${contact.phone}` : "",
        contact.city ? `City: ${contact.city}` : "",
        employer.companyName ? `Company Name: ${employer.companyName}` : "",
        employer.hiringManagerName
          ? `Hiring Manager: ${employer.hiringManagerName}`
          : "",
        currentDraftText ? `Current Draft:\n${currentDraftText}` : "",
      ].filter(Boolean);

      const candidateContext = contextParts.join("\n\n");

      const genRes = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "editor",
          targetJobTitle: jobTitle,
          companyName: employer.companyName,
          hiringManagerName: employer.hiringManagerName,
          candidateContext,
          existingDraft: currentDraftText,
        }),
      });

      if (!genRes.ok) {
        const err = await genRes.json();
        throw new Error(err.error || "Failed to generate cover letter");
      }

      const generated = await genRes.json();
      const generatedContent = generated.content
        ? plainToHtmlParagraphs(generated.content)
        : [generated.opening, generated.body, generated.closing]
            .filter(Boolean)
            .map((text: string) => `<p>${escapeHtml(text)}</p>`)
            .join("");

      if (!generatedContent) {
        throw new Error("AI returned an empty draft.");
      }

      setCoverLetterData((prev) => ({
        ...prev,
        content: generatedContent,
      }));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to generate. Please try again.";
      setInlineGenerateError(
        message
      );
    } finally {
      setIsInlineGenerating(false);
    }
  };

  const getFullText = () => {
    const { contact, employer, content, date } = coverLetterData;
    const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");

    const stripHtml = (input: string) => {
      const v = input ?? "";
      if (!v) return "";
      if (!/<[a-z][\s\S]*>/i.test(v)) return v;
      const tmp = document.createElement("div");
      tmp.innerHTML = v;
      return (tmp.innerText || tmp.textContent || "").trimEnd();
    };

    const contentText = stripHtml(content);

    const lines: string[] = [];
    if (fullName) lines.push(fullName);
    if (contact.address || contact.city)
      lines.push([contact.address, contact.city].filter(Boolean).join(", "));
    if (contact.phone || contact.email)
      lines.push([contact.phone, contact.email].filter(Boolean).join(" | "));
    if (date) lines.push("", date);
    if (employer.hiringManagerName) lines.push("", employer.hiringManagerName);
    if (employer.jobTitle) lines.push(employer.jobTitle);
    if (employer.companyName) lines.push(employer.companyName);
    if (employer.companyAddress) lines.push(employer.companyAddress);
    if (contentText) lines.push("", contentText);
    return lines.join("\n");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getFullText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stripContentToPlain = (html: string) => {
    if (!html?.trim()) return "";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return (tmp.innerText || tmp.textContent || "").trim();
  };

  const getCoverLetterTitle = () => {
    const savedTitle = coverLetterQuery.data?.title?.trim();
    if (savedTitle) return savedTitle;

    const jobTitle = coverLetterData.employer.jobTitle.trim();
    if (jobTitle) return `Cover letter - ${jobTitle}`;

    const companyName = coverLetterData.employer.companyName.trim();
    if (companyName) return `Cover letter - ${companyName}`;

    return "cover-letter";
  };

  const toSafeFileName = (value: string) =>
    (value || "cover-letter")
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/\s+/g, " ")
      .trim();

  const toPdfContentHtml = (value: string) => {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) return "";
    if (/<[a-z][\s\S]*>/i.test(trimmed)) {
      return trimmed.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
    }
    return plainToHtmlParagraphs(trimmed);
  };

  const buildCoverLetterPdfHtml = () => {
    const { contact, employer, date, content } = coverLetterData;
    const template = getCoverLetterTemplate(coverLetterData.templateId);
    const isModernAts = template.id === "modern-ats";
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
        font-family: ${isModernAts
          ? '"Helvetica Neue", Arial, sans-serif'
          : 'Georgia, "Times New Roman", serif'};
        color: ${isModernAts ? "#18181b" : "#27272a"};
        background: #ffffff;
      }
      .page {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        padding: ${isModernAts ? "16mm 18mm 18mm 18mm" : "18mm 20mm 20mm 20mm"};
        line-height: ${isModernAts ? "1.55" : "1.6"};
        font-size: 12px;
      }
      .accent {
        width: 58px;
        height: 4px;
        border-radius: 999px;
        background: #18181b;
        margin-bottom: 14px;
      }
      .name {
        font-size: ${isModernAts ? "18px" : "20px"};
        font-weight: ${isModernAts ? "600" : "700"};
        margin: 0 0 6px;
        letter-spacing: ${isModernAts ? "0.1px" : "0.2px"};
      }
      .meta { margin: 0; color: ${isModernAts ? "#3f3f46" : "#52525b"}; }
      .section { margin-top: 18px; }
      .recipient-name {
        margin: 0;
        font-weight: ${isModernAts ? "600" : "400"};
      }
      .recipient-job {
        margin: 0;
        color: #52525b;
      }
      .recipient-company {
        margin: 0;
        font-weight: ${isModernAts ? "600" : "500"};
      }
      .recipient-address {
        margin: 0;
        color: #52525b;
      }
      .body p { margin: 0 0 14px; }
      .body p:last-child { margin-bottom: 0; }
      .body ul, .body ol { margin: 0 0 14px 20px; }
    </style>
  </head>
  <body>
    <div class="page">
      ${isModernAts ? `<div class="accent"></div>` : ""}
      ${fullName ? `<p class="name">${escapeHtml(fullName)}</p>` : ""}
      ${(contact.address || contact.city)
        ? `<p class="meta">${escapeHtml([contact.address, contact.city].filter(Boolean).join(", "))}</p>`
        : ""}
      ${(contact.phone || contact.email)
        ? `<p class="meta">${escapeHtml([contact.phone, contact.email].filter(Boolean).join(" | "))}</p>`
        : ""}

      ${date ? `<p class="section">${escapeHtml(date)}</p>` : ""}

      ${(employer.hiringManagerName || employer.jobTitle || employer.companyName || employer.companyAddress)
        ? `<div class="section">
            ${employer.hiringManagerName ? `<p class="recipient-name">${escapeHtml(employer.hiringManagerName)}</p>` : ""}
            ${employer.jobTitle ? `<p class="recipient-job">${escapeHtml(employer.jobTitle)}</p>` : ""}
            ${employer.companyName ? `<p class="recipient-company">${escapeHtml(employer.companyName)}</p>` : ""}
            ${employer.companyAddress ? `<p class="recipient-address">${escapeHtml(employer.companyAddress)}</p>` : ""}
           </div>`
        : ""}

      <div class="section body">
        ${bodyHtml}
      </div>
    </div>
  </body>
</html>`;
  };

  const handleDownloadPdf = async () => {
    setPdfError("");

    const plain = stripContentToPlain(coverLetterData.content);
    if (!plain) {
      setPdfError("Add letter content before downloading PDF.");
      return;
    }

    try {
      setIsDownloadingPdf(true);
      const fileName = toSafeFileName(getCoverLetterTitle());
      const html = buildCoverLetterPdfHtml();

      const response = await fetch("/api/cover-letter/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, fileName }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName || "cover-letter"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not download PDF. Try again.";
      setPdfError(message);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleFinish = async () => {
    setFinishError("");
    setPdfError("");
    const plain = stripContentToPlain(coverLetterData.content);
    if (!plain) {
      setFinishError("Add letter content before saving.");
      return;
    }
    try {
      if (isEditing && coverLetterId) {
        await updateCoverLetter.mutateAsync({
          id: coverLetterId,
          data: coverLetterData,
        });
      } else {
        await saveCoverLetter.mutateAsync({ data: coverLetterData });
      }
      router.push("/dashboard/documents/cover-letters");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not save. Try again.";
      setFinishError(message);
    }
  };

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isEditing && coverLetterQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading cover letter...</p>
        </div>
      </div>
    );
  }

  if (isEditing && coverLetterQuery.error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{coverLetterQuery.error.message}</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => router.push("/dashboard/documents/cover-letters")}
          >
            Back to Cover Letters
          </Button>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Method picker / Upload dialog */}
      <Dialog open={methodDialogOpen} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-lg p-8"
          showCloseButton={false}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          {/* ─── View: Pick method ─── */}
          {dialogView === "pick" && (
            <>
              <DialogHeader className="items-center pb-2">
                <DialogTitle className="text-2xl font-bold text-center">
                  How will you make your cover letter?
                </DialogTitle>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  Choose a method to get started.
                </p>
              </DialogHeader>

              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setDialogView("upload");
                    resetUpload();
                  }}
                  className="group relative w-full text-left rounded-xl border-2 border-sky-300 bg-sky-50 p-5 transition-all hover:border-sky-400 hover:bg-sky-100/80 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow-sm">
                      <Sparkles className="h-7 w-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base font-semibold text-foreground">
                          Generate from resume
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-200/70 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700">
                          <Sparkles className="h-3 w-3" />
                          20% faster
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Upload your resume and AI writes it for you.
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-sky-400 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMethodDialogOpen(false);
                  }}
                  className="group w-full text-left rounded-xl border-2 border-border bg-card p-5 transition-all hover:border-muted-foreground/30 hover:bg-muted/10 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted/30 text-foreground">
                      <PenLine className="h-7 w-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-base font-semibold text-foreground">Write from scratch</span>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        We&apos;ll walk you through it, step by step.
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              </div>
            </>
          )}

          {/* ─── View: Upload resume ─── */}
          {dialogView === "upload" && (
            <>
              <DialogHeader className="items-center pb-2">
                <DialogTitle className="text-2xl font-bold text-center">
                  Upload your resume
                </DialogTitle>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  We&apos;ll extract your info and write the cover letter.
                </p>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                {/* Drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isGenerating && fileInputRef.current?.click()}
                  className={cn(
                    "relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all",
                    isDragging
                      ? "border-foreground bg-muted/20 scale-[1.02]"
                      : isGenerating
                        ? "border-border bg-muted/10 cursor-default"
                        : selectedFile
                          ? "border-sky-300 bg-sky-50/50"
                          : "border-border bg-card hover:border-muted-foreground/40 hover:bg-muted/10"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isGenerating}
                  />

                  {/* No file + not generating */}
                  {!selectedFile && !isGenerating && (
                    <div className="space-y-3">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted/20">
                        {isDragging ? (
                          <FileUp className="h-6 w-6 text-foreground" />
                        ) : (
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {isDragging ? "Drop it here" : "Drag & drop your resume"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          or click to browse — PDF, DOCX up to 10MB
                        </p>
                      </div>
                    </div>
                  )}

                  {/* File selected, not generating */}
                  {selectedFile && !isGenerating && (
                    <div className="space-y-2">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100">
                        <FileText className="h-6 w-6 text-sky-600" />
                      </div>
                      <p className="text-sm font-semibold text-foreground break-all">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resetUpload();
                        }}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                        Remove
                      </button>
                    </div>
                  )}

                  {/* Generating */}
                  {isGenerating && (
                    <div className="space-y-3">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted/20">
                        <Loader2 className="h-6 w-6 text-foreground animate-spin" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {progressLabel}
                      </p>
                      <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-muted/20 px-3 py-1 text-xs text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Please wait
                      </div>
                    </div>
                  )}
                </div>

                {/* Error */}
                {uploadError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">{uploadError}</p>
                  </div>
                )}

                {/* Action buttons */}
                {!isGenerating && (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setDialogView("pick");
                        resetUpload();
                      }}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={!selectedFile}
                      onClick={handleGenerateFromResume}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Main Content — 3-step editor */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex flex-col lg:flex-row w-full h-full">
          {/* Left: Form */}
          <div
            className={`${
              showPreview ? "lg:w-1/2" : "w-full"
            } flex flex-col h-full overflow-auto`}
          >
            <div className="flex-1 pb-20 sm:pb-24 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
              <div className="mb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h1 className="font-display text-3xl font-bold text-foreground">
                      {isEditing ? "Edit Cover Letter" : "Write Cover Letter"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Fill in each section and see changes live in the preview.
                    </p>
                  </div>
                  {!isEditing && (
                    <Button variant="outline" asChild>
                      <Link href="/cover-letter/templates">Change Template</Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="bg-background rounded-lg mb-4 space-y-8">
                <div className="space-y-3">
                  <ContactForm
                    data={coverLetterData.contact}
                    onChange={(contact) =>
                      setCoverLetterData({ ...coverLetterData, contact })
                    }
                  />
                </div>

                <div className="space-y-3">
                  <EmployerForm
                    data={coverLetterData.employer}
                    onChange={(employer) => {
                      setCoverLetterData({ ...coverLetterData, employer });
                      if (inlineGenerateError && employer.jobTitle.trim()) {
                        setInlineGenerateError("");
                      }
                    }}
                  />
                </div>

                <div className="space-y-3">
                  <LetterBodyForm
                    content={coverLetterData.content}
                    onContentChange={(content) =>
                      setCoverLetterData({ ...coverLetterData, content })
                    }
                    onGenerateWithAI={handleInlineGenerateWithAI}
                    isGeneratingWithAI={isInlineGenerating}
                    generateError={inlineGenerateError}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Navigation */}
            <div
              className={`fixed bottom-0 left-0 bg-background border-t p-3 sm:p-4 z-30 ${
                showPreview ? "lg:w-1/2 w-full" : "w-full"
              }`}
            >
              <div className="flex items-center justify-between px-2 sm:px-4">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  size="sm"
                >
                  <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden">
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[90vh]">
                      <SheetHeader>
                        <SheetTitle>Cover Letter Preview</SheetTitle>
                        <SheetDescription>Preview your cover letter in real-time</SheetDescription>
                      </SheetHeader>
                      <div className="mt-4 h-[calc(90vh-100px)] overflow-auto">
                        <CoverLetterPreview data={coverLetterData} />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="hidden lg:flex"
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Hide Preview
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Show Preview
                      </>
                    )}
                  </Button>

                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <>
                        <Check className="mr-1 h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-4 w-4" />
                        <span className="hidden sm:inline">Copy</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                  >
                    {isDownloadingPdf ? (
                      <>
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        <span className="hidden sm:inline">Generating...</span>
                      </>
                    ) : (
                      <>
                        <Download className="mr-1 h-4 w-4" />
                        <span className="hidden sm:inline">Download PDF</span>
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleFinish}
                    disabled={saveCoverLetter.isPending || updateCoverLetter.isPending}
                  >
                    <Check className="mr-1 sm:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">
                      {saveCoverLetter.isPending || updateCoverLetter.isPending
                        ? "Saving..."
                        : "Finish"}
                    </span>
                  </Button>
                </div>
              </div>
              {finishError && (
                <p className="px-6 pb-2 text-center text-xs text-red-600 sm:text-left">
                  {finishError}
                </p>
              )}
              {pdfError && (
                <p className="px-6 pb-2 text-center text-xs text-red-600 sm:text-left">
                  {pdfError}
                </p>
              )}
            </div>
          </div>

          {/* Right: Preview */}
          {showPreview && (
            <div className="hidden lg:block lg:w-1/2 h-full overflow-auto py-6 px-8 bg-zinc-50 dark:bg-zinc-900">
              <CoverLetterPreview data={coverLetterData} className="h-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CoverLetterWritePageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading cover letter editor...</p>
      </div>
    </div>
  );
}

export default function WriteCoverLetterPage() {
  return (
    <Suspense fallback={<CoverLetterWritePageFallback />}>
      <WriteCoverLetterPageContent />
    </Suspense>
  );
}
