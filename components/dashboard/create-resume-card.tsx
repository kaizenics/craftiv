"use client";

import { Plus } from "@/components/ui/icons";
import Link from "next/link";

export function CreateResumeCard() {
  return (
    <Link
      href="/resume/templates"
      className="group flex flex-col items-start gap-4 rounded-xl border-2 border-dashed border-border bg-card p-6 transition-all hover:border-muted/20 hover:shadow-md sm:flex-row sm:items-center"
    >
      <div className="flex h-24 w-20 items-center justify-center rounded-lg bg-muted/10 dark:bg-muted/800">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/20 text-muted-foreground transition-transform group-hover:scale-110">
          <Plus className="h-6 w-6" />
        </div>
      </div> 
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground">Create a New Resume</h3>
        <p className="text-sm text-muted-foreground">
          Start from scratch or upload a resume to edit it.
        </p>
      </div>
    </Link>
  );
}
