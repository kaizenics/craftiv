"use client";

import { useEffect, useMemo, useState } from "react";

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

export type BulkImportResult = {
  imported: number;
  duplicates: number;
  failed: number;
  results: Array<{
    url: string;
    status: "imported" | "duplicate" | "failed";
    message?: string;
  }>;
};

type JobImportPanelProps = {
  disabled: boolean;
  pending: boolean;
  error: string | null;
  /** Shown when the pasted URL belongs to a source that cannot be searched. */
  restrictionNote: string | null;
  /** A job handed over by the clipper, to prefill the form. */
  prefill?: JobImportValues | null;
  bulkResult?: BulkImportResult | null;
  onDetectUrl: (url: string) => void;
  onSubmit: (values: JobImportValues) => void;
  onBulkSubmit: (urls: string[]) => void;
};

const MIN_DESCRIPTION = 40;

export function JobImportPanel({
  disabled,
  pending,
  error,
  restrictionNote,
  prefill,
  bulkResult,
  onDetectUrl,
  onSubmit,
  onBulkSubmit,
}: JobImportPanelProps) {
  // A clipped job is present on first render, so it seeds the fields directly.
  // The user still reviews and submits: arriving with a clip never imports it.
  const [mode, setMode] = useState<"paste" | "url" | "bulk">("paste");
  const [url, setUrl] = useState(prefill?.url ?? "");
  const [description, setDescription] = useState(prefill?.description ?? "");
  const [title, setTitle] = useState(prefill?.title ?? "");
  const [company, setCompany] = useState(prefill?.company ?? "");
  const [bulkUrls, setBulkUrls] = useState("");

  const parsedBulkUrls = useMemo(
    () => [...new Set(bulkUrls.split(/\r?\n/).map((value) => value.trim()).filter(Boolean))],
    [bulkUrls],
  );

  const remaining = PROMPT_INPUT_LIMITS.jobDescription - description.length;

  // Telling the parent about the clipped URL is a call outward, not local
  // state, so it belongs in an effect. It surfaces the source's restriction
  // note when the clip came from somewhere Craftiv may not search.
  useEffect(() => {
    if (prefill?.url) onDetectUrl(prefill.url);
    // onDetectUrl is redefined each render by the page; depending on it would
    // re-fire this on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const canSubmit = useMemo(() => {
    if (disabled || pending) return false;
    if (mode === "bulk") return parsedBulkUrls.length > 0 && parsedBulkUrls.length <= 20;
    if (mode === "url") return url.trim().length > 0;
    return description.trim().length >= MIN_DESCRIPTION;
  }, [disabled, pending, mode, url, description, parsedBulkUrls.length]);

  function handleUrlChange(value: string) {
    setUrl(value);
    onDetectUrl(value);
  }

  function handleSubmit() {
    if (!canSubmit) return;

    if (mode === "bulk") {
      onBulkSubmit(parsedBulkUrls);
      return;
    }

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
        onValueChange={(value) => setMode(value as "paste" | "url" | "bulk")}
        className="mt-4"
      >
        <TabsList className="w-full">
          <TabsTrigger value="paste" className="flex-1">
            Paste description
          </TabsTrigger>
          <TabsTrigger value="url" className="flex-1">
            Job link
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex-1">
            Bulk links
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

        <TabsContent value="bulk" className="mt-3 space-y-3">
          <div>
            <label htmlFor="bulk-job-urls" className="text-sm font-medium">
              Job links
            </label>
            <Textarea
              id="bulk-job-urls"
              value={bulkUrls}
              onChange={(event) => setBulkUrls(event.target.value)}
              rows={9}
              disabled={disabled || pending}
              placeholder={"https://example.com/jobs/one\nhttps://example.com/jobs/two"}
              aria-describedby="bulk-job-urls-hint"
            />
            <p
              id="bulk-job-urls-hint"
              className={cn(
                "mt-1 text-xs",
                parsedBulkUrls.length > 20
                  ? "text-destructive-surface-foreground"
                  : "text-muted-foreground",
              )}
            >
              {parsedBulkUrls.length} unique {parsedBulkUrls.length === 1 ? "link" : "links"}.{" "}
              Maximum 20 per batch.
            </p>
          </div>

          {bulkResult ? (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
              <p className="font-medium">
                {bulkResult.imported} imported, {bulkResult.duplicates} already saved, {bulkResult.failed} failed
              </p>
              {bulkResult.failed > 0 ? (
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {bulkResult.results
                    .filter((result) => result.status === "failed")
                    .map((result) => (
                      <li key={result.url} className="break-all">
                        {result.url}: {result.message}
                      </li>
                    ))}
                </ul>
              ) : null}
            </div>
          ) : null}
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
            {mode === "bulk" ? "Importing..." : "Scoring..."}
          </>
        ) : (
          <>
            <Plus className="size-4" aria-hidden="true" />
            {mode === "bulk" ? `Import ${parsedBulkUrls.length} jobs` : "Add and score"}
          </>
        )}
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">Free — no credits used.</p>
    </section>
  );
}
