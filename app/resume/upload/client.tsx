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
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { NavbarComponent } from "@/components/navbar";

type UploadState = "idle" | "dragging" | "scanning" | "success" | "error";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];
const MAX_SIZE = 10 * 1024 * 1024;

export default function ResumeUploadPageClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = authClient.useSession();

  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

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
      router.push("/sign-up?redirect=%2Fresume%2Fupload&intent=resume-upload");
      return;
    }

    setUploadState("scanning");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });

      if (response.status === 401) {
        router.push("/sign-up?redirect=%2Fresume%2Fupload&intent=resume-upload");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to parse resume");
      }

      const { data } = await response.json();

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
      <NavbarComponent />

      <div className="mx-auto max-w-2xl px-4 pt-28 pb-12 sm:pt-32 sm:pb-16">
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
              {!selectedFile && uploadState !== "scanning" && (
                <motion.div
                  key="upload-prompt"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-4"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
                    {uploadState === "dragging" ? (
                      <FileUp className="h-8 w-8 text-zinc-900" />
                    ) : (
                      <Upload className="h-8 w-8 text-zinc-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-zinc-900">
                      {uploadState === "dragging"
                        ? "Drop your resume here"
                        : "Drag & drop your resume"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      or click to browse files
                    </p>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Supports PDF and DOCX up to 10MB
                  </p>
                </motion.div>
              )}

              {selectedFile && uploadState !== "scanning" && uploadState !== "success" && (
                <motion.div
                  key="selected-file"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 break-all">
                      {selectedFile.name}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700"
                  >
                    <X className="h-3 w-3" />
                    Remove file
                  </button>
                </motion.div>
              )}

              {uploadState === "scanning" && (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-5"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
                    <Loader2 className="h-8 w-8 text-zinc-700 animate-spin" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-zinc-900">
                      Scanning your resume...
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      This may take a few seconds. Please keep this tab open.
                    </p>
                  </div>
                  <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    Parsing in progress
                  </div>
                </motion.div>
              )}

              {uploadState === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-zinc-900">
                      Resume scanned successfully!
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Redirecting to template selection...
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {errorMessage && uploadState === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3"
          >
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{errorMessage}</p>
          </motion.div>
        )}

        {!isProcessing && uploadState !== "success" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 flex flex-col sm:flex-row gap-3"
          >
            <Button
              onClick={handleUploadAndScan}
              disabled={!selectedFile}
              className="flex-1 h-auto py-2"
            >
              {session?.user ? "Upload Resume" : "Continue to Sign Up"}
            </Button>

            {selectedFile && (
              <Button
                variant="outline"
                onClick={handleReset}
                className="h-auto py-3.5"
              >
                Reset
              </Button>
            )}
          </motion.div>
        )}

        {!session?.user && !isProcessing && uploadState !== "success" && (
          <p className="mt-3 text-center text-xs text-zinc-500">
            Guest mode is enabled. We&apos;ll ask you to sign up before AI scanning starts.
          </p>
        )}
      </div>
    </div>
  );
}
