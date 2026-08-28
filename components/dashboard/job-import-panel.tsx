"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Loader2, Plus } from "@/components/ui/icons";
import { PROMPT_INPUT_LIMITS } from "@/lib/constants/prompt-limits";
import { cn } from "@/lib/utils";

export type JobImportValues = {
  url?: string;
  description?: string;
  title?: string;
  company?: string;
};

type JobImportPanelProps = {
  disabled: boolean;
  pending: boolean;
  error: string | null;
  /** Shown when the pasted URL belongs to a source that cannot be searched. */
  restrictionNote: string | null;
  onDetectUrl: (url: string) => void;
  onSubmit: (values: JobImportValues) => void;
};

const MIN_DESCRIPTION = 40;

export function JobImportPanel({
  disabled,
  pending,
  error,
  restrictionNote,
  onDetectUrl,
  onSubmit,
}: JobImportPanelProps) {
  const [mode, setMode] = useState<"paste" | "url">("paste");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");

  const remaining = PROMPT_INPUT_LIMITS.jobDescription - description.length;

  const canSubmit = useMemo(() => {
    if (disabled || pending) return false;
    if (mode === "url") return url.trim().length > 0;
    return description.trim().length >= MIN_DESCRIPTION;
  }, [disabled, pending, mode, url, description]);

  function handleUrlChange(value: string) {
    setUrl(value);
    onDetectUrl(value);
  }

  function handleSubmit() {
    if (!canSubmit) return;

    onSubmit({
      url: url.trim() || undefined,
      description: description.trim() || undefined,
      title: title.trim() || undefined,
      company: company.trim() || undefined,
    });

    setDescription("");
    setTitle("");
    setCompany("");
    setUrl("");
  }

  return (
    <section
      aria-labelledby="job-import-heading"
      className="rounded-xl border border-border bg-card p-4"
    >
      <h2 id="job-import-heading" className="font-heading text-base font-semibold">
        Add a job
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Paste a job from OnlineJobs.ph or anywhere else. Scoring is instant and free.
      </p>

      <Tabs
        value={mode}
        onValueChange={(value) => setMode(value as "paste" | "url")}
        className="mt-4"
      >
        <TabsList className="w-full">
          <TabsTrigger value="paste" className="flex-1">
            Paste description
          </TabsTrigger>
          <TabsTrigger value="url" className="flex-1">
            Job link
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paste" className="mt-3 space-y-3">
          <div>
            <label htmlFor="job-description" className="sr-only">
              Job description
            </label>
            <Textarea
              id="job-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={PROMPT_INPUT_LIMITS.jobDescription}
              rows={8}
              disabled={disabled || pending}
              placeholder="Paste the full job description here..."
              aria-describedby="job-description-hint"
            />
            <p
              id="job-description-hint"
              className={cn(
                "mt-1 text-xs",
                remaining < 200 ? "text-warning-surface-foreground" : "text-muted-foreground",
              )}
            >
              {description.length < MIN_DESCRIPTION
                ? `Paste at least ${MIN_DESCRIPTION} characters so it can be scored.`
                : `${remaining.toLocaleString()} characters remaining.`}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label htmlFor="job-title" className="sr-only">
                Job title
              </label>
              <Input
                id="job-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={PROMPT_INPUT_LIMITS.targetRole}
                disabled={disabled || pending}
                placeholder="Job title (optional)"
              />
            </div>
            <div>
              <label htmlFor="job-company" className="sr-only">
                Company
              </label>
              <Input
                id="job-company"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                maxLength={PROMPT_INPUT_LIMITS.name}
                disabled={disabled || pending}
                placeholder="Company (optional)"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="url" className="mt-3 space-y-3">
          <div>
            <label htmlFor="job-url" className="sr-only">
              Job link
            </label>
            <Input
              id="job-url"
              value={url}
              onChange={(event) => handleUrlChange(event.target.value)}
              disabled={disabled || pending}
              placeholder="https://www.onlinejobs.ph/jobseekers/job/..."
              inputMode="url"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              The link names the job and keeps it deduplicated. Paste the description too for a
              real match score.
            </p>
          </div>

          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={PROMPT_INPUT_LIMITS.jobDescription}
            rows={6}
            disabled={disabled || pending}
            placeholder="Optional: paste the description to score this job now."
            aria-label="Job description"
          />
        </TabsContent>
      </Tabs>

      {restrictionNote ? (
        <p className="mt-3 flex gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{restrictionNote}</span>
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-3 flex gap-2 rounded-lg border border-destructive-border bg-destructive-surface p-3 text-xs text-destructive-surface-foreground"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}

      <Button onClick={handleSubmit} disabled={!canSubmit} className="mt-4 w-full">
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Scoring...
          </>
        ) : (
          <>
            <Plus className="size-4" aria-hidden="true" />
            Add and score
          </>
        )}
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">Free — no credits used.</p>
    </section>
  );
}
