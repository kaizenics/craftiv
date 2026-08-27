"use client";

import { useId, useMemo, useRef, useState } from "react";

import { Check, FileText, Search } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type PickableResume = {
  id: string;
  title: string;
  status: string;
};

type AtsResumePickerProps = {
  resumes: PickableResume[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/**
 * A real radiogroup: arrow keys move between options, Space/Enter selects, and
 * only the active option is in the tab order (roving tabindex). The previous
 * implementation was a bare list of buttons with no group name or checked state,
 * which gave screen readers nothing to announce.
 */
export function AtsResumePicker({
  resumes,
  isLoading,
  selectedId,
  onSelect,
}: AtsResumePickerProps) {
  const [query, setQuery] = useState("");
  const groupLabelId = useId();
  const searchId = useId();
  const optionRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return resumes;
    return resumes.filter((resume) => resume.title.toLowerCase().includes(trimmed));
  }, [query, resumes]);

  // When search hides the selected option, nothing would carry tabIndex 0 and the
  // group would drop out of the tab order entirely; fall back to the first visible row.
  const selectedIsVisible = filtered.some((resume) => resume.id === selectedId);

  function focusOption(id: string) {
    optionRefs.current.get(id)?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const lastIndex = filtered.length - 1;
    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        nextIndex = index === lastIndex ? 0 : index + 1;
        break;
      case "ArrowUp":
      case "ArrowLeft":
        nextIndex = index === 0 ? lastIndex : index - 1;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = lastIndex;
        break;
      default:
        return;
    }

    if (nextIndex === null) return;
    const next = filtered[nextIndex];
    if (!next) return;

    event.preventDefault();
    // Radiogroups select on focus, so arrowing through also updates the choice.
    onSelect(next.id);
    focusOption(next.id);
  }

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading your resumes</span>
        {[0, 1].map((key) => (
          <div
            key={key}
            className="h-[3.75rem] animate-pulse rounded-lg border border-border bg-muted/40"
          />
        ))}
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
        No saved resumes yet. Build one first, or switch to the Upload tab.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span id={groupLabelId} className="text-sm font-medium text-foreground">
          Choose a saved resume
        </span>
        {/* An explicit count stops the scroll area from reading as truncated. */}
        <span className="text-xs text-muted-foreground">
          {filtered.length === resumes.length
            ? `${resumes.length} ${resumes.length === 1 ? "resume" : "resumes"}`
            : `${filtered.length} of ${resumes.length}`}
        </span>
      </div>

      {resumes.length > 4 && (
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search your resumes by title"
            placeholder="Search your resumes..."
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>
      )}

      <div
        role="radiogroup"
        aria-labelledby={groupLabelId}
        className="max-h-64 space-y-2 overflow-y-auto pr-1"
      >
        {filtered.length === 0 ? (
          <p className="px-1 py-3 text-sm text-muted-foreground">
            No resume matches &ldquo;{query}&rdquo;.
          </p>
        ) : (
          filtered.map((resume, index) => {
            const isSelected = resume.id === selectedId;
            return (
              <button
                key={resume.id}
                ref={(node) => {
                  if (node) optionRefs.current.set(resume.id, node);
                  else optionRefs.current.delete(resume.id);
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected || (!selectedIsVisible && index === 0) ? 0 : -1}
                onClick={() => onSelect(resume.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/40"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    isSelected ? "bg-primary/10" : "bg-muted/60"
                  )}
                >
                  <FileText
                    className={cn(
                      "h-4 w-4",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                    aria-hidden="true"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {resume.title}
                  </span>
                  <span className="block text-xs capitalize text-muted-foreground">
                    {resume.status}
                  </span>
                </span>
                {isSelected && (
                  <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
