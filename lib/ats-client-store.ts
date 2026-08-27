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

let cachedDraftRaw: string | null = null;
let cachedDraft = "";

function getJobDescriptionSnapshot(): string {
  // Cheap identity guard: the draft helper reads several legacy keys, so key the
  // cache on the canonical one and re-read only when it changes.
  const raw = localStorage.getItem("craftiv:shared-job-target");
  if (raw === cachedDraftRaw) return cachedDraft;
  cachedDraftRaw = raw;
  cachedDraft = readSharedJobTargetDraft(localStorage).jobDescription;
  return cachedDraft;
}

function getJobDescriptionServerSnapshot(): string {
  return "";
}

/** The shared job-target draft, also used by the AI Resume assistant. */
export function useJobDescriptionDraft(): string {
  return useSyncExternalStore(
    subscribe,
    getJobDescriptionSnapshot,
    getJobDescriptionServerSnapshot
  );
}

export function saveJobDescriptionDraft(jobDescription: string) {
  const current = readSharedJobTargetDraft(localStorage);
  writeSharedJobTargetDraft(localStorage, {
    role: current.role,
    jobDescription,
  });
}
