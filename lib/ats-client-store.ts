"use client";

import { useSyncExternalStore } from "react";

import { readSharedJobTargetDraft, writeSharedJobTargetDraft } from "@/lib/job-target";
import type { PersistedAtsReport } from "@/lib/types/ats-report";

const ATS_REPORT_STORAGE_KEY = "craftiv:ats-checker:last-report";

/**
 * localStorage-backed reads exposed through `useSyncExternalStore`.
 *
 * Reading storage during render (the previous approach) makes the server and
 * first client render disagree and breaks hydration; reading it in an effect
 * causes a cascading second render. `useSyncExternalStore` is the supported way
 * to do this: it returns the server snapshot during SSR and swaps to the real
 * value at hydration without an extra render pass.
 */

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // `storage` fires in *other* tabs, so a check run elsewhere shows up here too.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/**
 * `getSnapshot` must return a referentially stable value between calls or React
 * re-renders forever, so parsed results are cached against their raw string.
 */
let cachedReportRaw: string | null = null;
let cachedReport: PersistedAtsReport | null = null;

function getReportSnapshot(): PersistedAtsReport | null {
  const raw = localStorage.getItem(ATS_REPORT_STORAGE_KEY);
  if (raw === cachedReportRaw) return cachedReport;

  cachedReportRaw = raw;
  cachedReport = null;

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<PersistedAtsReport>;
      if (parsed.report) {
        cachedReport = {
          report: parsed.report,
          sourceLabel: parsed.sourceLabel || "Saved ATS analysis",
          savedAt: parsed.savedAt || "",
        };
      }
    } catch {
      cachedReport = null;
    }
  }

  return cachedReport;
}

function getReportServerSnapshot(): PersistedAtsReport | null {
  return null;
}

export function useLastAtsReport(): PersistedAtsReport | null {
  return useSyncExternalStore(subscribe, getReportSnapshot, getReportServerSnapshot);
}

export function saveAtsReport(value: PersistedAtsReport) {
  localStorage.setItem(ATS_REPORT_STORAGE_KEY, JSON.stringify(value));
  emit();
}

export type JobTargetDraft = {
  role: string;
  jobDescription: string;
};

const EMPTY_DRAFT: JobTargetDraft = { role: "", jobDescription: "" };

let cachedDraftRaw: string | null = null;
let cachedDraft: JobTargetDraft = EMPTY_DRAFT;

function getJobTargetSnapshot(): JobTargetDraft {
  // Cheap identity guard: the draft helper reads several legacy keys, so key the
  // cache on the canonical one and re-read only when it changes.
  const raw = localStorage.getItem("craftiv:shared-job-target");
  if (raw === cachedDraftRaw) return cachedDraft;

  cachedDraftRaw = raw;
  const draft = readSharedJobTargetDraft(localStorage);
  cachedDraft = { role: draft.role, jobDescription: draft.jobDescription };
  return cachedDraft;
}

function getJobTargetServerSnapshot(): JobTargetDraft {
  return EMPTY_DRAFT;
}

/**
 * The shared job target (role + description), used by both the ATS Checker and
 * the AI Assistant so a description pasted in one is present in the other.
 */
export function useJobTargetDraft(): JobTargetDraft {
  return useSyncExternalStore(
    subscribe,
    getJobTargetSnapshot,
    getJobTargetServerSnapshot
  );
}

export function useJobDescriptionDraft(): string {
  return useJobTargetDraft().jobDescription;
}

export function saveJobTargetDraft(draft: Partial<JobTargetDraft>) {
  const current = readSharedJobTargetDraft(localStorage);
  writeSharedJobTargetDraft(localStorage, {
    role: draft.role ?? current.role,
    jobDescription: draft.jobDescription ?? current.jobDescription,
  });
}

export function saveJobDescriptionDraft(jobDescription: string) {
  saveJobTargetDraft({ jobDescription });
}
