"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2, Plus, Search } from "@/components/ui/icons";
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
  searchPending: boolean;
  platformSearchAvailable: boolean;
  error: string | null;
  /** Shown when the pasted URL belongs to a source that cannot be searched. */
  restrictionNote: string | null;
  /** A job handed over by the clipper, to prefill the form. */
  prefill?: JobImportValues | null;
  bulkResult?: BulkImportResult | null;
  onDetectUrl: (url: string) => void;
  onSubmit: (values: JobImportValues) => void;
  onBulkSubmit: (urls: string[]) => void;
  onPlatformSearch: (query: string) => void;
  embedded?: boolean;
};

const MIN_DESCRIPTION = 40;

export function JobImportPanel({
  disabled,
  pending,
  searchPending,
  platformSearchAvailable,
  error,
  restrictionNote,
  prefill,
  bulkResult,
  onDetectUrl,
  onSubmit,
  onBulkSubmit,
  onPlatformSearch,
  embedded = false,
}: JobImportPanelProps) {
  // A clipped job is present on first render, so it seeds the fields directly.
  // The user still reviews and submits: arriving with a clip never imports it.
  const [mode, setMode] = useState<"search" | "paste" | "url" | "bulk">("search");
  const [searchPlatform, setSearchPlatform] = useState<"onlinejobs_ph" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [url, setUrl] = useState(prefill?.url ?? "");
  const [description, setDescription] = useState(prefill?.description ?? "");
  const [title, setTitle] = useState(prefill?.title ?? "");
  const [company, setCompany] = useState(prefill?.company ?? "");
  const [bulkUrls, setBulkUrls] = useState("");
  const instanceId = useId();
  const fieldId = (name: string) => `${instanceId}-${name}`;

  const parsedBulkUrls = useMemo(
    () => [...new Set(bulkUrls.split(/\r?\n/).map((value) => value.trim()).filter(Boolean))],
    [bulkUrls],
  );

  const remaining = PROMPT_INPUT_LIMITS.jobDescription - description.length;
  const modePending = mode === "search" ? searchPending : pending;

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
    if (disabled || modePending) return false;
    if (mode === "search") {
      return searchPlatform === "onlinejobs_ph" && searchQuery.trim().length >= 2;
    }
    if (mode === "bulk") return parsedBulkUrls.length > 0 && parsedBulkUrls.length <= 20;
    if (mode === "url") return url.trim().length > 0;
    return description.trim().length >= MIN_DESCRIPTION;
  }, [disabled, modePending, mode, url, description, parsedBulkUrls.length, searchPlatform, searchQuery]);

  function handleUrlChange(value: string) {
    setUrl(value);
    onDetectUrl(value);
  }

  function handleSubmit() {
    if (!canSubmit) return;

    if (mode === "search") {
      onPlatformSearch(searchQuery.trim());
      return;
    }

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
      aria-labelledby={fieldId("job-import-heading")}
      className={cn(
        "bg-card",
        embedded
          ? "flex min-h-0 flex-1 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          : "rounded-xl border border-border p-4",
      )}
    >
      <div className={cn(embedded && "shrink-0 pb-3 pt-2")}>
      <h2 id={fieldId("job-import-heading")} className="font-heading text-base font-semibold">
        Add jobs
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Search a platform or import jobs you already found. Scoring is instant and free.
      </p>
      </div>

      <Tabs
        value={mode}
        onValueChange={(value) => setMode(value as "search" | "paste" | "url" | "bulk")}
        className={cn("mt-4", embedded && "flex min-h-0 flex-1 flex-col")}
      >
        <TabsList className="grid w-full shrink-0 grid-cols-4">
          <TabsTrigger value="search">
            Search
          </TabsTrigger>
          <TabsTrigger value="paste" className="flex-1">
            Paste
          </TabsTrigger>
          <TabsTrigger value="url" className="flex-1">
            Link
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex-1">
            Bulk
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className={cn("mt-3 space-y-3", embedded && "min-h-0 flex-1 overflow-y-auto pb-2")}>
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor={fieldId("job-platform")}>
              Job platform
            </label>
            <Select
              value={searchPlatform ?? undefined}
              onValueChange={(value) => setSearchPlatform(value as "onlinejobs_ph")}
            >
              <SelectTrigger
                id={fieldId("job-platform")}
                className="mt-1.5 h-11 w-full rounded-lg bg-background px-3"
                aria-label="Select a job platform"
              >
                <SelectValue placeholder="Choose a platform">
                  {searchPlatform === "onlinejobs_ph" ? (
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Image
                          src="/brands/onlinejobs-ph.ico"
                          alt=""
                          width={16}
                          height={16}
                          aria-hidden="true"
                        />
                      </span>
                      <span>OnlineJobs.ph</span>
                    </span>
                  ) : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="onlinejobs_ph" disabled={!platformSearchAvailable}>
                  <span className="flex items-center gap-2.5">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Image
                        src="/brands/onlinejobs-ph.ico"
                        alt=""
                        width={16}
                        height={16}
                        aria-hidden="true"
                      />
                    </span>
                    <span>OnlineJobs.ph</span>
                  </span>
                </SelectItem>
                <SelectItem value="linkedin" disabled>
                  LinkedIn · Coming soon
                </SelectItem>
                <SelectItem value="indeed" disabled>
                  Indeed · Coming soon
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {searchPlatform === "onlinejobs_ph"
                ? "Searching public OnlineJobs.ph listings."
                : "Select an available platform to continue."}
            </p>
          </div>

          {searchPlatform === "onlinejobs_ph" ? (
            <div>
              <label htmlFor={fieldId("platform-job-search")} className="text-xs font-medium text-muted-foreground">
                Search keywords
              </label>
              <Input
                id={fieldId("platform-job-search")}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="e.g. virtual assistant"
                disabled={disabled || searchPending}
                className="mt-1.5"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && canSubmit) handleSubmit();
                }}
              />
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="paste" className={cn("mt-3 space-y-3", embedded && "min-h-0 flex-1 overflow-y-auto pb-2")}>
          <div>
            <label htmlFor={fieldId("job-description")} className="sr-only">
              Job description
            </label>
            <Textarea
              id={fieldId("job-description")}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={PROMPT_INPUT_LIMITS.jobDescription}
              rows={8}
              disabled={disabled || pending}
              placeholder="Paste the full job description here..."
              aria-describedby={fieldId("job-description-hint")}
            />
            <p
              id={fieldId("job-description-hint")}
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
              <label htmlFor={fieldId("job-title")} className="sr-only">
                Job title
              </label>
              <Input
                id={fieldId("job-title")}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={PROMPT_INPUT_LIMITS.targetRole}
                disabled={disabled || pending}
                placeholder="Job title (optional)"
              />
            </div>
            <div>
              <label htmlFor={fieldId("job-company")} className="sr-only">
                Company
              </label>
              <Input
                id={fieldId("job-company")}
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                maxLength={PROMPT_INPUT_LIMITS.name}
                disabled={disabled || pending}
                placeholder="Company (optional)"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="url" className={cn("mt-3 space-y-3", embedded && "min-h-0 flex-1 overflow-y-auto pb-2")}>
          <div>
            <label htmlFor={fieldId("job-url")} className="sr-only">
              Job link
            </label>
            <Input
              id={fieldId("job-url")}
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

        <TabsContent value="bulk" className={cn("mt-3 space-y-3", embedded && "min-h-0 flex-1 overflow-y-auto pb-2")}>
          <div>
            <label htmlFor={fieldId("bulk-job-urls")} className="text-sm font-medium">
              Job links
            </label>
            <Textarea
              id={fieldId("bulk-job-urls")}
              value={bulkUrls}
              onChange={(event) => setBulkUrls(event.target.value)}
              rows={9}
              disabled={disabled || pending}
              placeholder={"https://example.com/jobs/one\nhttps://example.com/jobs/two"}
              aria-describedby={fieldId("bulk-job-urls-hint")}
            />
            <p
              id={fieldId("bulk-job-urls-hint")}
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

      {restrictionNote && mode === "url" ? (
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

      <div className={cn(embedded && "shrink-0 border-t border-border bg-card pt-3")}>
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={cn("mt-4 w-full", embedded && "mt-0")}
      >
        {modePending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {mode === "search" ? "Searching..." : mode === "bulk" ? "Importing..." : "Scoring..."}
          </>
        ) : (
          <>
            {mode === "search" ? (
              <Search className="size-4" aria-hidden="true" />
            ) : (
              <Plus className="size-4" aria-hidden="true" />
            )}
            {mode === "search"
              ? "Search and score"
              : mode === "bulk"
                ? `Import ${parsedBulkUrls.length} jobs`
                : "Add and score"}
          </>
        )}
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">Free — no credits used.</p>
      </div>
    </section>
  );
}
