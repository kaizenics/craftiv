"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Check, Copy, Eye, Users } from "@/components/ui/icons";
import { InterviewPrepDialog } from "@/components/dashboard/interview-prep-dialog";
import { bandStyle } from "@/lib/ats-display";
import { APPLICATION_STATUS_LABELS } from "@/lib/types/job-hunter";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";

const TYPE_LABELS = { role: "Role", behavioural: "Behavioural", motivation: "Motivation" } as const;

/**
 * The user's own answer: the main thing on each card. Saves when the field loses
 * focus, so typing never waits on the network.
 */
function NoteField({ prepId, index, initial }: { prepId: string; index: number; initial: string }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const save = trpc.jobHunter.saveInterviewNote.useMutation({
    onSuccess: () => setSaved(value),
    onError: (error) => toast.error(error.message),
  });
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const status = save.isPending ? "Saving..." : value !== saved ? "Unsaved changes" : saved ? "Saved" : "";

  return (
    <div className="rounded-xl bg-muted/40 p-4 transition-colors focus-within:bg-muted/60">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`note-${prepId}-${index}`} className="text-sm font-medium text-foreground">
          Your answer
        </label>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {status ? (
            <span className={cn(status === "Saved" && "text-success-surface-foreground")}>
              {status === "Saved" ? <Check className="mr-1 inline size-3" aria-hidden="true" /> : null}
              {status}
            </span>
          ) : null}
        </span>
      </div>
      <textarea
        id={`note-${prepId}-${index}`}
        value={value}
        maxLength={4000}
        rows={4}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => {
          if (value !== saved) save.mutate({ prepId, index, note: value });
        }}
        placeholder="How would you answer this? Write it the way you would say it out loud."
        className="mt-2 w-full resize-y border-0 bg-transparent p-0 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <p className="mt-1 text-right text-xs tabular-nums text-muted-foreground">
        {words} {words === 1 ? "word" : "words"}
        {words > 0 && words < 40 ? " · aim for 60 to 120" : ""}
      </p>
    </div>
  );
}

export default function InterviewPrepPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const query = trpc.jobHunter.getInterviewPreps.useQuery({ matchId });
  const [setIndex, setSetIndex] = useState(0);
  // On by default: rehearsing your own answer first is the point; it can be switched off.
  const [practice, setPractice] = useState(true);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }
  if (query.error || !query.data) {
    return (
      <div className="rounded-xl bg-card p-8 text-center">
        <p className="font-medium text-foreground">This interview prep could not be found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/applications">Back to Applications</Link>
        </Button>
      </div>
    );
  }

  const { job, sets } = query.data;
  const jobLabel = [job.title, job.company].filter(Boolean).join(" at ");
  const band = bandStyle(job.score);
  const current = sets[setIndex];

  const copyAll = () => {
    if (!current) return;
    const text = current.questions
      .map((q, i) => {
        const mine = current.notes[String(i)];
        return `${i + 1}. ${q.question}\n\n${mine || q.answer}${q.tip ? `\n\nTip: ${q.tip}` : ""}`;
      })
      .join("\n\n---\n\n");
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      },
      () => {},
    );
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/applications" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Applications
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className={cn("flex size-14 shrink-0 items-center justify-center rounded-xl border", band.surface, band.border)}>
            <span className={cn("font-display text-xl font-semibold tabular-nums", band.text)}>{job.score}</span>
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">Interview prep</h1>
            <p className="mt-1 text-muted-foreground">
              {jobLabel} · {APPLICATION_STATUS_LABELS[job.applicationStatus]}
            </p>
          </div>
        </div>
        {current ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={copyAll}>
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied ? "Copied" : "Copy all"}
            </Button>
            <Button variant="outline" onClick={() => setRegenerateOpen(true)}>
              <Users className="size-4" aria-hidden="true" />
              New set
            </Button>
          </div>
        ) : null}
      </div>

      {!current ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="font-medium text-foreground">No interview prep for this job yet</p>
          <Button className="mt-4" onClick={() => setRegenerateOpen(true)}>
            <Users className="size-4" aria-hidden="true" />
            Prepare questions
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-xl bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-3">
              <Switch
                checked={practice}
                onCheckedChange={(next) => {
                  setPractice(next);
                  setRevealed(new Set());
                }}
                aria-label="Practice mode"
              />
              <span>
                <span className="block text-sm font-medium text-foreground">Practice mode</span>
                <span className="block text-xs text-muted-foreground">Hide the answers, say yours out loud, then reveal.</span>
              </span>
            </label>
            {sets.length > 1 ? (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                Set
                <select
                  value={setIndex}
                  onChange={(event) => {
                    setSetIndex(Number(event.target.value));
                    setRevealed(new Set());
                  }}
                  className="rounded-lg bg-muted/60 px-2 py-1.5 text-sm text-foreground"
                >
                  {sets.map((set, i) => (
                    <option key={set.id} value={i}>
                      {i === 0 ? "Latest" : `Earlier`} · {new Date(set.createdAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <ol className="space-y-4">
            {current.questions.map((q, index) => {
              const hidden = practice && !revealed.has(index);
              return (
                <li key={`${current.id}-${index}`} className="rounded-2xl bg-card p-5 sm:p-6">
                  <p className="text-xs font-medium text-muted-foreground">
                    {index + 1}. {TYPE_LABELS[q.type]}
                  </p>
                  <h2 className="mt-1 text-lg font-medium leading-snug text-foreground">{q.question}</h2>

                  {/* Your answer comes first; the suggested one is something to compare against. */}
                  <div className="mt-5">
                    <NoteField key={`${current.id}-${index}`} prepId={current.id} index={index} initial={current.notes[String(index)] ?? ""} />
                  </div>

                  <div className="mt-4 border-t border-border pt-4">
                    {hidden ? (
                      <button
                        type="button"
                        onClick={() => setRevealed((prev) => new Set(prev).add(index))}
                        className="flex w-full items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3 text-left transition-colors hover:bg-primary/10"
                      >
                        <span>
                          <span className="block text-sm font-medium text-foreground">Compare with a suggested answer</span>
                          <span className="block text-xs text-muted-foreground">Try yours first, then reveal it.</span>
                        </span>
                        <Eye className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      </button>
                    ) : (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Suggested answer, from your resume</p>
                        <p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-foreground">{q.answer}</p>
                        {q.tip ? (
                          <p className="mt-3 rounded-lg border border-primary/15 bg-primary/5 p-3 text-xs leading-relaxed text-foreground">
                            <span className="font-semibold text-primary">Tip: </span>
                            {q.tip}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}

      <InterviewPrepDialog
        matchId={regenerateOpen ? matchId : null}
        jobLabel={jobLabel}
        onOpenChange={(open) => {
          setRegenerateOpen(open);
          if (!open) {
            // Sets come newest first, so a freshly generated one lands at index 0.
            setSetIndex(0);
            setRevealed(new Set());
            void query.refetch();
          }
        }}
      />
    </div>
  );
}
