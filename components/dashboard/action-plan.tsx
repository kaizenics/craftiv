"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";

type Step = {
  title: string;
  done: boolean;
  meta: string;
  detail: string;
  cta: string;
  href: string;
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/**
 * The job-search loop as a checklist that ticks itself off from the account's own data.
 * The first unfinished step is the only one expanded; once every step is done it hides.
 */
export function ActionPlan({ resumeCount, resumesLoading }: { resumeCount: number; resumesLoading: boolean }) {
  const { data: stats, isLoading: statsLoading } = trpc.jobHunter.stats.useQuery();

  if (resumesLoading || statsLoading || !stats) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  const { byStatus, total, tailored, bestScore } = stats;
  const moved = byStatus.applied + byStatus.interviewing + byStatus.offer + byStatus.rejected;

  const steps: Step[] = [
    {
      title: "Resume ready",
      done: resumeCount > 0,
      meta: plural(resumeCount, "resume"),
      detail: "Pick a template or upload the resume you already have. Every job gets scored against it.",
      cta: "Create a resume",
      href: "/resume/templates",
    },
    {
      title: "Find jobs",
      done: total > 0,
      meta: `${plural(total, "job")} saved`,
      detail: "Save a search that runs daily, or clip a post from any job board. Scoring is free.",
      cta: "Open Job Hunter",
      href: "/dashboard/job-hunter",
    },
    {
      title: "Tailor for a role",
      done: tailored > 0,
      meta: `${tailored} tailored`,
      detail:
        bestScore > 0
          ? `Your best match scores ${bestScore}. Tailor your resume for it in one click, and get your credits back if the score does not go up.`
          : "Pick a job and rewrite your resume for it in one click. No higher score, no charge.",
      cta: "Open your matches",
      href: "/dashboard/job-hunter",
    },
    {
      title: "Track applications",
      done: moved > 0,
      meta: `${moved} applied`,
      detail: "Move each job from saved to applied, interviewing and offer, so you always know where things stand.",
      cta: "Update statuses",
      href: "/dashboard/job-hunter",
    },
  ];

  const doneCount = steps.filter((step) => step.done).length;
  // All done: a compact summary instead of the checklist, so the card never just vanishes.
  if (doneCount === steps.length) {
    return (
      <section
        data-tour="action-plan"
        className="flex flex-col gap-4 rounded-2xl bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success text-white">
            <Check className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Your job search is on track</h2>
            <p className="text-sm tabular-nums text-muted-foreground">
              {steps.map((step) => step.meta).join(", ")}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="shrink-0 rounded-xl">
          <Link href="/dashboard/job-hunter">
            Open Job Hunter
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </section>
    );
  }
  const nextIndex = steps.findIndex((step) => !step.done);

  return (
    <section data-tour="action-plan" className="rounded-2xl bg-card p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-xl font-semibold text-foreground">Your job search</h2>
        <p className="text-sm tabular-nums text-muted-foreground">
          {doneCount} of {steps.length} done
        </p>
      </div>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>

      <ol className="mt-5 grid gap-1">
        {steps.map((step, index) => {
          const isNext = index === nextIndex;
          return (
            <li
              key={step.title}
              className={cn("rounded-xl px-3 py-3 sm:px-4", isNext && "bg-primary/5 py-4")}
              aria-current={isNext ? "step" : undefined}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full",
                    step.done && "bg-success text-white",
                    isNext && "bg-primary text-primary-foreground",
                    !step.done && !isNext && "bg-muted text-muted-foreground",
                  )}
                >
                  {step.done ? <Check className="size-3.5" aria-hidden /> : <span className="text-xs font-semibold">{index + 1}</span>}
                </span>
                <span className={cn("flex-1 text-[15px] font-medium", step.done ? "text-muted-foreground" : "text-foreground")}>
                  {step.title}
                  {step.done ? <span className="sr-only"> (done)</span> : null}
                </span>
                <span className="text-sm tabular-nums text-muted-foreground">{step.meta}</span>
              </div>

              {isNext ? (
                <div className="mt-3 flex flex-col gap-4 pl-9 sm:flex-row sm:items-end sm:justify-between">
                  <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
                  <Button asChild className="shrink-0 rounded-xl">
                    <Link href={step.href}>
                      {step.cta}
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
