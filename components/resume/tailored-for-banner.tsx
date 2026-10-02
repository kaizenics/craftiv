"use client";

import Link from "next/link";

import { Target } from "@/components/ui/icons";
import { trpc } from "@/trpc/client";

/** Shows which Job Hunter job a resume was tailored for, with a way back to it. */
export function TailoredForBanner({ resumeId }: { resumeId: string }) {
  const { data: job } = trpc.jobHunter.tailoredFor.useQuery({ resumeId }, { retry: false });
  if (!job) return null;

  const label = job.company ? `${job.title} at ${job.company}` : job.title;
  return (
    <div className="flex items-center justify-between gap-3 border-b bg-primary/5 px-3 py-2 text-sm sm:px-6">
      <p className="flex min-w-0 items-center gap-2">
        <Target className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="truncate">
          Tailored for <span className="font-medium">{label}</span>
        </span>
      </p>
      <Link href="/dashboard/job-hunter" className="shrink-0 font-medium text-primary hover:underline">
        View job
      </Link>
    </div>
  );
}
