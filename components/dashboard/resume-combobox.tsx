"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Check, ChevronDown, Clock, FileText, Search } from "@/components/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboboxResume = {
  id: string;
  title: string;
  status: string;
  updatedAt: Date | string;
};

type ResumeComboboxProps = {
  resumes: ComboboxResume[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  label: string;
};

export function formatResumeDate(date: Date | string): string {
  const value = new Date(date);
  const diffDays = Math.floor((Date.now() - value.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * A real combobox over the user's resumes.
 *
 * The previous implementation swapped the input's `value` between the search
 * query and the selected title depending on open state, exposed no combobox
 * semantics, and had no keyboard handling at all -- the listbox could be opened
 * by focus but not navigated, chosen, or dismissed without a mouse. This wires
 * up aria-expanded/-controls/-activedescendant plus arrow, Enter, and Escape.
 */
export function ResumeCombobox({
  resumes,
  selectedId,
  onSelect,
  label,
}: ResumeComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const triggerId = useId();
  const listboxId = useId();
  const labelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = resumes.find((resume) => resume.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return resumes;
    return resumes.filter((resume) => resume.title.toLowerCase().includes(trimmed));
  }, [query, resumes]);

  // Keep the highlighted row in range as the filter narrows the list.
  const safeIndex = filtered.length === 0 ? -1 : Math.min(activeIndex, filtered.length - 1);
  const activeOptionId = safeIndex >= 0 ? `${listboxId}-option-${safeIndex}` : undefined;

  useEffect(() => {
    if (!open || safeIndex < 0) return;
    listRef.current
      ?.querySelector(`[data-index="${safeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, safeIndex]);

  function openWith(index: number) {
    setActiveIndex(index);
    setOpen(true);
  }

  function commit(index: number) {
    const resume = filtered[index];
    if (!resume) return;
    onSelect(resume.id);
    setOpen(false);
    setQuery("");
    triggerRef.current?.focus();
  }

  function handleListKeyDown(event: React.KeyboardEvent) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((prev) => (prev >= filtered.length - 1 ? 0 : prev + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((prev) => (prev <= 0 ? filtered.length - 1 : prev - 1));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(filtered.length - 1);
        break;
      case "Enter":
        event.preventDefault();
        commit(safeIndex);
        break;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        setQuery("");
        triggerRef.current?.focus();
        break;
      default:
        break;
    }
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const startIndex = Math.max(
        0,
        resumes.findIndex((resume) => resume.id === selectedId)
      );
      openWith(event.key === "ArrowDown" ? startIndex : resumes.length - 1);
    }
  }

  return (
    <div className="space-y-1.5">
      <span id={labelId} className="text-sm font-medium text-foreground">
        {label}
      </span>

      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <PopoverTrigger asChild>
          <button
            id={triggerId}
            ref={triggerRef}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            aria-labelledby={`${labelId} ${triggerId}`}
            onKeyDown={handleTriggerKeyDown}
            className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
              <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {selected?.title ?? "Select a resume"}
              </span>
              {selected && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {formatResumeDate(selected.updatedAt)}
                  <span aria-hidden="true">&middot;</span>
                  <span className="capitalize">{selected.status}</span>
                </span>
              )}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) gap-2 p-2"
          onOpenAutoFocus={(event) => {
            // Focus the filter field, not the first option, so typing narrows.
            event.preventDefault();
            listRef.current?.querySelector("input")?.focus();
          }}
          onKeyDown={handleListKeyDown}
        >
          <div ref={listRef} className="space-y-2">
            {resumes.length > 4 && (
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  aria-label="Filter resumes by title"
                  aria-controls={listboxId}
                  aria-activedescendant={activeOptionId}
                  placeholder="Filter resumes..."
                  className="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>
            )}

            <div
              id={listboxId}
              role="listbox"
              aria-labelledby={labelId}
              className="max-h-64 space-y-1 overflow-y-auto"
            >
              {filtered.length === 0 ? (
                <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                  No resume matches &ldquo;{query}&rdquo;.
                </p>
              ) : (
                filtered.map((resume, index) => {
                  const isSelected = resume.id === selectedId;
                  const isActive = index === safeIndex;
                  return (
                    <div
                      key={resume.id}
                      id={`${listboxId}-option-${index}`}
                      data-index={index}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => commit(index)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                        isActive && "bg-muted",
                        isSelected && !isActive && "bg-muted/50"
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                        <FileText
                          className="h-4 w-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {resume.title}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {formatResumeDate(resume.updatedAt)}
                          <span aria-hidden="true">&middot;</span>
                          <span className="capitalize">{resume.status}</span>
                        </span>
                      </span>
                      {isSelected && (
                        <Check
                          className="h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
