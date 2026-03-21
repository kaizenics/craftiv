"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  FileUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type UploadState = "idle" | "dragging" | "scanning" | "success" | "error";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];
const MAX_SIZE = 10 * 1024 * 1024;

export default function ResumeUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = authClient.useSession();

  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [progress, setProgress] = useState(0);

  const validateFile = (file: File): string | null => {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return "Only PDF and DOCX files are accepted.";
    }
    if (file.size > MAX_SIZE) {
      return "File size must be under 10MB.";
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      setUploadState("error");
      return;
    }
    setSelectedFile(file);
    setErrorMessage("");
    setUploadState("idle");
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadState("dragging");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadState((prev) => (prev === "dragging" ? "idle" : prev));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setUploadState("idle");

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleUploadAndScan = async () => {
    if (!selectedFile) return;

    if (!session?.user) {
      localStorage.setItem("pendingUpload", "true");
      router.push("/sign-in?redirect=/resume/upload");
      return;
    }

    setUploadState("scanning");
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 3;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to parse resume");
      }

      const { data } = await response.json();

      setProgress(100);
      setUploadState("success");

      localStorage.setItem("uploadedResumeData", JSON.stringify(data));

      setTimeout(() => {
        router.push("/resume/templates?from=upload");
      }, 1200);
    } catch (error: any) {
      setUploadState("error");
      setErrorMessage(error.message || "Something went wrong. Please try again.");
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadState("idle");
    setErrorMessage("");
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isProcessing = uploadState === "scanning";

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Stepper */}
      <div className="border-b border-zinc-100 bg-white py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-4 px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white">
              1
            </span>
            <span className="text-sm font-medium text-zinc-900">Upload resume</span>
          </div>
          <div className="h-px w-8 bg-zinc-200" />
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-500">
              2
            </span>
            <span className="text-sm text-zinc-500">Choose template</span>
          </div>
          <div className="h-px w-8 bg-zinc-200" />
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-500">
              3
            </span>
            <span className="text-sm text-zinc-500">Edit & download</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="mb-6 text-zinc-500 hover:text-zinc-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Button>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl font-bold text-zinc-900 sm:text-4xl"
          >
            Upload your resume
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 text-base text-zinc-600"
          >
            We&apos;ll scan your existing resume and pre-fill everything for you.
            Then just pick a template and customize.
          </motion.p>
        </div>

        {/* Drop Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-300 ${
              uploadState === "dragging"
                ? "border-zinc-900 bg-zinc-50 scale-[1.02]"
                : uploadState === "error"
                ? "border-red-300 bg-red-50/50"
                : uploadState === "success"
                ? "border-emerald-300 bg-emerald-50/50"
                : isProcessing
                ? "border-zinc-300 bg-zinc-50/50 cursor-default"
                : "border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isProcessing}
            />

            <AnimatePresence mode="wait">
              {/* Idle / Dragging state */}
              {(uploadState === "idle" || uploadState === "dragging") && !selectedFile && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
                    <Upload className="h-7 w-7 text-zinc-500" />
                  </div>
                  <p className="text-lg font-semibold text-zinc-900">
                    {uploadState === "dragging"
                      ? "Drop your resume here"
                      : "Drag & drop your resume"}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    or{" "}
                    <span className="font-medium text-zinc-900 underline underline-offset-2">
                      browse files
                    </span>
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                      <FileText className="h-3 w-3" />
                      PDF
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                      <FileText className="h-3 w-3" />
                      DOCX
                    </span>
                    <span className="text-xs text-zinc-400">Max 10MB</span>
                  </div>
                </motion.div>
              )}

              {/* File selected (ready to scan) */}
              {selectedFile && uploadState === "idle" && (
                <motion.div
                  key="selected"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900">
                    <FileUp className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-lg font-semibold text-zinc-900">{selectedFile.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {formatFileSize(selectedFile.size)} &middot;{" "}
                    {selectedFile.name.endsWith(".pdf") ? "PDF" : "DOCX"}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="mt-3 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </motion.div>
              )}

              {/* Processing state */}
              {isProcessing && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900">
                    <Loader2 className="h-7 w-7 text-white animate-spin" />
                  </div>
                  <p className="text-lg font-semibold text-zinc-900">
                    Scanning your resume...
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Extracting your details — name, experience, skills, and more
                  </p>
                  <div className="mt-6 mx-auto max-w-xs">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                      <motion.div
                        className="h-full rounded-full bg-zinc-900"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-zinc-400">{progress}%</p>
                  </div>
                </motion.div>
              )}

              {/* Success state */}
              {uploadState === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
                    <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                  </div>
                  <p className="text-lg font-semibold text-zinc-900">
                    Resume scanned successfully!
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Redirecting you to choose a template...
                  </p>
                </motion.div>
              )}

              {/* Error state */}
              {uploadState === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
                    <AlertCircle className="h-7 w-7 text-red-600" />
                  </div>
                  <p className="text-lg font-semibold text-zinc-900">Upload failed</p>
                  <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-900 hover:underline"
                  >
                    Try again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Scan Button */}
        {selectedFile && uploadState === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex justify-center"
          >
            <Button
              size="lg"
              onClick={handleUploadAndScan}
              className="px-8 py-6 text-base font-semibold"
            >
              <FileText className="mr-2 h-5 w-5" />
              Scan My Resume
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
