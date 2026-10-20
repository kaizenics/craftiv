"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, FileText, Target, Users } from "@/components/ui/icons";
import { ApplyAssistDialog } from "@/components/dashboard/apply-assist-dialog";
import { InterviewPrepDialog, type InterviewQuestion } from "@/components/dashboard/interview-prep-dialog";
import { bandStyle } from "@/lib/ats-display";
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from "@/lib/types/job-hunter";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";

const TABS: { id: string; label: string; statuses: ApplicationStatus[] }[] = [
  { id: "to-apply", label: "To apply", statuses: ["new", "saved"] },
  { id: "applied", label: "Applied", statuses: ["applied"] },
  { id: "interviewing", label: "Interviewing", statuses: ["interviewing"] },
  { id: "offer", label: "Offers", statuses: ["offer"] },
];

/**
 * One place to act on jobs: apply with the tailored letter, and prepare for the
 * interview. Jobs themselves are found and scored in the Job Hunter.
 */
export default function ApplicationsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const matchesQuery = trpc.jobHunter.listMatches.useQuery({ limit: 100 });
  const [tab, setTab] = useState(TABS[0].id);
  const [applyMatchId, setApplyMatchId] = useState<string | null>(null);
  const [prepMatchId, setPrepMatchId] = useState<string | null>(null);
  const [prepQuestions, setPrepQuestions] = useState<InterviewQuestion[] | null>(null);

  const refresh = () =>
    Promise.all([utils.jobHunter.listMatches.invalidate(), utils.jobHunter.stats.invalidate()]);
  const updateMatch = trpc.jobHunter.updateMatch.useMutation({
    onSuccess: refresh,
    onError: (error) => toast.error(error.message),
  });
  const interviewPrep = trpc.jobHunter.interviewPrep.useMutation({
    onSuccess: (result) => setPrepQuestions(result.questions),
    onError: (error) => toast.error(error.message),
  });

  const matches = useMemo(() => matchesQuery.data ?? [], [matchesQuery.data]);
  const counts = useMemo(
    () => Object.fromEntries(TABS.map((t) => [t.id, matches.filter((m) => t.statuses.includes(m.applicationStatus)).length])),
    [matches],
  );
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];
  const rows = matches.filter((m) => active.statuses.includes(m.applicationStatus));

  const findMatch = (id: string | null) => (id ? (matches.find((m) => m.id === id) ?? null) : null);
  const labelFor = (id: string | null) => {
    const match = findMatch(id);
    return (match && [match.posting.title, match.posting.company].filter(Boolean).join(" at ")) || "this job";
  };
  const applyMatch = findMatch(applyMatchId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">Applications</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Apply with your tailored cover letter, and prepare for the interview, for every job you are pursuing.
        </p>
      </div>

      <div role="tablist" aria-label="Application stage" className="flex flex-wrap gap-1 rounded-xl bg-muted p-1 sm:w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label} <span className="tabular-nums text-muted-foreground">({counts[t.id] ?? 0})</span>
          </button>
        ))}
      </div>

      {matchesQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <Target className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 font-medium text-foreground">No jobs here yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {tab === "to-apply"
              ? "Find and score jobs in the Job Hunter, then come back to apply."
              : `Jobs you move to ${active.label.toLowerCase()} show up here.`}
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/job-hunter">Open Job Hunter</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((match) => {
            const band = bandStyle(match.score);
            return (
              <li
                key={match.id}
                className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:p-5"
              >
                <span className={cn("flex size-14 shrink-0 flex-col items-center justify-center rounded-xl border", band.surface, band.border)}>
                  <span className={cn("font-display text-xl font-semibold tabular-nums", band.text)}>{match.score}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{match.posting.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {[match.posting.company, APPLICATION_STATUS_LABELS[match.applicationStatus]].filter(Boolean).join(" · ")}
                    {match.tailoredCoverLetterId ? " · Letter ready" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="h-9" onClick={() => setApplyMatchId(match.id)}>
                    Apply
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9"
                    onClick={() => {
                      setPrepQuestions(null);
                      setPrepMatchId(match.id);
                    }}
                  >
                    <Users className="size-4" aria-hidden="true" />
                    Interview prep
                  </Button>
                  {match.tailoredCoverLetterId ? (
                    <Button size="sm" variant="ghost" className="h-9" asChild>
                      <Link href={`/cover-letter/write?id=${match.tailoredCoverLetterId}`}>
                        <FileText className="size-4" aria-hidden="true" />
                        Edit letter
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ApplyAssistDialog
        key={applyMatchId ?? "none"}
        matchId={applyMatchId}
        jobLabel={labelFor(applyMatchId)}
        alreadyApplied={applyMatch?.applicationStatus === "applied"}
        onOpenChange={(open) => {
          if (!open) setApplyMatchId(null);
        }}
        onTailor={() => {
          setApplyMatchId(null);
          toast.info("Use Tailor on the job's card to write its cover letter.");
          router.push("/dashboard/job-hunter");
        }}
        onApplied={() => {
          if (applyMatch && (applyMatch.applicationStatus === "new" || applyMatch.applicationStatus === "saved")) {
            updateMatch.mutate({ matchId: applyMatch.id, applicationStatus: "applied" });
            toast.success("Marked as applied.");
          }
        }}
      />

      <InterviewPrepDialog
        open={prepMatchId !== null}
        onOpenChange={(open) => {
          if (!open) setPrepMatchId(null);
        }}
        jobLabel={labelFor(prepMatchId)}
        pending={interviewPrep.isPending}
        questions={prepQuestions}
        onRun={() => {
          if (prepMatchId) interviewPrep.mutate({ matchId: prepMatchId });
        }}
      />
    </div>
  );
}
