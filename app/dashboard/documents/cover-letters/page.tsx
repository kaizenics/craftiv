"use client";

import { useState } from "react";
import { Mail, Sparkles, PenLine, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

export default function CoverLettersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Cover Letters</h1>
          <p className="text-muted-foreground">Create tailored cover letters for your job applications.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Cover Letter
        </Button>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
          <Mail className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 font-semibold text-foreground">No cover letters yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Create your first cover letter by generating one from a resume or writing from scratch.
        </p>
        <Button className="mt-6" onClick={() => setDialogOpen(true)}>
          Get Started
        </Button>
      </div>

      {/* Creation method dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader className="items-center">
            <DialogTitle className="text-xl font-bold text-center">
              How will you make your cover letter?
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2 space-y-3">
            {/* Generate from resume */}
            <Link
              href="/dashboard/documents/cover-letters/generate"
              className="group relative flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/10"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Generate from resume</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-600">
                    <Sparkles className="h-3 w-3" />
                    20% faster
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Our AI will generate your cover letter based on it.</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>

            {/* Write from scratch */}
            <Link
              href="/dashboard/documents/cover-letters/write"
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/10"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/30 text-foreground">
                <PenLine className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-foreground">Write from scratch</span>
                <p className="text-sm text-muted-foreground">We&apos;ll walk you through it, step by step.</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
