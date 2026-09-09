"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Check,
  ChevronDown,
  FileText,
  Grid,
  List,
  Loader2,
  Play,
  Plus,
  ScanSearch,
  Search,
  Sparkles,
  Target,
  Trophy,
} from "@/components/ui/icons";
import {
  DemoCursor,
  TypingCaret,
  useCursorTarget,
  useElementSize,
} from "@/components/feature-demo-cursor";
import { cn } from "@/lib/utils";

type FeatureId = "hunter" | "ats" | "assistant";

const features = [
  {
    id: "hunter" as const,
    name: "Job Hunter",
    description: "Import job posts, score each role against your resume, and track strong matches through your application pipeline.",
    href: "/dashboard/job-hunter",
    cta: "Open Job Hunter",
    icon: Target,
  },
  {
    id: "ats" as const,
    name: "ATS Checker",
    description: "See how an applicant tracking system reads your resume, including section scores, missing keywords, and specific fixes.",
    href: "/dashboard/ats-checker",
    cta: "Open ATS Checker",
    icon: ScanSearch,
  },
  {
    id: "assistant" as const,
    name: "AI Resume Assistant",
    description: "Rewrite summaries and experience, add role-specific keywords, and turn ordinary duties into stronger achievements.",
    href: "/dashboard/ai-resume",
    cta: "Open AI Assistant",
    icon: Sparkles,
  },
];

const RESUME_NAME = "Angela - Virtual Assistant";
const RESUME_OPTIONS = [RESUME_NAME, "Angela - Executive Support", "Angela - Operations"];

/**
 * One instant of the tour.
 *
 * Everything except the typed text is declared per beat rather than held in
 * state, so the whole demo is a pure function of (feature, beat index). That
 * keeps the runner down to a single timer and makes each script readable as a
 * storyboard.
 */
type Beat = {
  /** `data-cursor-target` the pointer travels to. */
  target?: string;
  action?: "click" | "type";
  /** Key into the typed-text map, for `type` beats. */
  field?: string;
  text?: string;
  ms: number;
  /** Which result pane the right-hand column shows. */
  step: number;
  selectOpen?: boolean;
  /** Whether the resume dropdown has been chosen yet. */
  selected?: boolean;
  /** Stage magnification for this beat. 1 is the full, unzoomed panel. */
  zoom?: number;
  /**
   * Region the zoom frames, as a `data-cursor-target`. Deliberately a region
   * rather than the pointer's own target: framing each control in turn would
   * lurch the whole panel on every beat, where holding one region lets the
   * cursor work inside a steady frame.
   */
  zoomTarget?: string;
};

const HUNTER_TITLE = "Executive Virtual Assistant";
const HUNTER_DESC =
  "Manage calendars, CRM updates, client email, and weekly reporting for a remote leadership team.";
const ATS_DESC =
  "We are looking for an executive virtual assistant with calendar management, CRM, client communication, and reporting experience.";
const ASSISTANT_ROLE = "Executive Virtual Assistant";
const ASSISTANT_DESC =
  "Manage schedules, client communication, CRM updates, and weekly reporting for a growing remote team.";

/**
 * Each interaction is staged in three beats: arrive, press, then act.
 *
 * Collapsing that breaks the illusion in one of two ways. Act on the same beat
 * as the press and the change appears to have happened already; act on a later
 * beat once the cursor has moved on and it looks self-triggered. Typing has the
 * same requirement as clicking -- characters must not start landing until the
 * pointer is in the field and has pressed it.
 *
 * Beats also carry the framing. The tour pushes in on whichever panel is being
 * worked and pulls back out to show the result, so the eye is led rather than
 * left to hunt for what changed on a full-width screenshot.
 */
const SCRIPTS: Record<FeatureId, Beat[]> = {
  hunter: [
    { target: "hunter-select", ms: 900, step: 0, zoom: 1.35, zoomTarget: "hunter-form" },
    { target: "hunter-select", action: "click", ms: 400, step: 0, zoom: 1.35, zoomTarget: "hunter-form" },
    { target: "hunter-select", ms: 560, step: 0, selectOpen: true, zoom: 1.35, zoomTarget: "hunter-form" },
    { target: "hunter-select-option", ms: 580, step: 0, selectOpen: true, zoom: 1.35, zoomTarget: "hunter-form" },
    { target: "hunter-select-option", action: "click", ms: 420, step: 0, selectOpen: true, zoom: 1.35, zoomTarget: "hunter-form" },
    { target: "hunter-title", ms: 520, step: 0, selected: true, zoom: 1.35, zoomTarget: "hunter-form" },
    { target: "hunter-title", action: "click", ms: 360, step: 0, selected: true, zoom: 1.35, zoomTarget: "hunter-form" },
    { target: "hunter-title", action: "type", field: "hunterTitle", text: HUNTER_TITLE, ms: 1400, step: 0, selected: true, zoom: 1.35, zoomTarget: "hunter-form" },
    { target: "hunter-desc", ms: 480, step: 0, selected: true, zoom: 1.35, zoomTarget: "hunter-form" },
    { target: "hunter-desc", action: "click", ms: 360, step: 0, selected: true, zoom: 1.35, zoomTarget: "hunter-form" },
    { target: "hunter-desc", action: "type", field: "hunterDesc", text: HUNTER_DESC, ms: 2200, step: 0, selected: true, zoom: 1.35, zoomTarget: "hunter-form" },
    { target: "hunter-submit", ms: 480, step: 0, selected: true, zoom: 1.35, zoomTarget: "hunter-form" },
    { target: "hunter-submit", action: "click", ms: 440, step: 0, selected: true, zoom: 1.35, zoomTarget: "hunter-form" },
    { target: "hunter-why", ms: 1100, step: 1, selected: true },
    { target: "hunter-why", action: "click", ms: 440, step: 1, selected: true, zoom: 1.2, zoomTarget: "hunter-result" },
    { target: "hunter-why", ms: 2200, step: 2, selected: true, zoom: 1.2, zoomTarget: "hunter-result" },
  ],
  ats: [
    { target: "ats-select", ms: 900, step: 0, zoom: 1.35, zoomTarget: "ats-form" },
    { target: "ats-select", action: "click", ms: 400, step: 0, zoom: 1.35, zoomTarget: "ats-form" },
    { target: "ats-select", ms: 560, step: 0, selectOpen: true, zoom: 1.35, zoomTarget: "ats-form" },
    { target: "ats-select-option", ms: 580, step: 0, selectOpen: true, zoom: 1.35, zoomTarget: "ats-form" },
    { target: "ats-select-option", action: "click", ms: 420, step: 0, selectOpen: true, zoom: 1.35, zoomTarget: "ats-form" },
    { target: "ats-desc", ms: 520, step: 0, selected: true, zoom: 1.35, zoomTarget: "ats-form" },
    { target: "ats-desc", action: "click", ms: 360, step: 0, selected: true, zoom: 1.35, zoomTarget: "ats-form" },
    { target: "ats-desc", action: "type", field: "atsDesc", text: ATS_DESC, ms: 2400, step: 0, selected: true, zoom: 1.35, zoomTarget: "ats-form" },
    { target: "ats-submit", ms: 460, step: 0, selected: true, zoom: 1.35, zoomTarget: "ats-form" },
    { target: "ats-submit", action: "click", ms: 440, step: 0, selected: true, zoom: 1.35, zoomTarget: "ats-form" },
    { target: "ats-submit", ms: 1500, step: 1, selected: true },
    { target: "ats-submit", ms: 2200, step: 2, selected: true, zoom: 1.15, zoomTarget: "ats-result" },
  ],
  assistant: [
    { target: "assistant-select", ms: 900, step: 0, zoom: 1.35, zoomTarget: "assistant-form" },
    { target: "assistant-select", action: "click", ms: 400, step: 0, zoom: 1.35, zoomTarget: "assistant-form" },
    { target: "assistant-select", ms: 560, step: 0, selectOpen: true, zoom: 1.35, zoomTarget: "assistant-form" },
    { target: "assistant-select-option", ms: 580, step: 0, selectOpen: true, zoom: 1.35, zoomTarget: "assistant-form" },
    { target: "assistant-select-option", action: "click", ms: 420, step: 0, selectOpen: true, zoom: 1.35, zoomTarget: "assistant-form" },
    { target: "assistant-role", ms: 520, step: 0, selected: true, zoom: 1.35, zoomTarget: "assistant-form" },
    { target: "assistant-role", action: "click", ms: 360, step: 0, selected: true, zoom: 1.35, zoomTarget: "assistant-form" },
    { target: "assistant-role", action: "type", field: "assistantRole", text: ASSISTANT_ROLE, ms: 1300, step: 0, selected: true, zoom: 1.35, zoomTarget: "assistant-form" },
    { target: "assistant-desc", ms: 480, step: 0, selected: true, zoom: 1.35, zoomTarget: "assistant-form" },
    { target: "assistant-desc", action: "click", ms: 360, step: 0, selected: true, zoom: 1.35, zoomTarget: "assistant-form" },
    { target: "assistant-desc", action: "type", field: "assistantDesc", text: ASSISTANT_DESC, ms: 2200, step: 0, selected: true, zoom: 1.35, zoomTarget: "assistant-form" },
    { target: "assistant-submit", ms: 460, step: 0, selected: true, zoom: 1.3, zoomTarget: "assistant-result" },
    { target: "assistant-submit", action: "click", ms: 440, step: 0, selected: true, zoom: 1.3, zoomTarget: "assistant-result" },
    { target: "assistant-submit", ms: 1300, step: 1, selected: true },
    { target: "assistant-submit", ms: 2200, step: 2, selected: true, zoom: 1.15, zoomTarget: "assistant-result" },
  ],
};

/** What a reduced-motion visitor sees: the finished demo, no cursor, no typing. */
const RESTING_TYPED: Record<string, string> = {
  hunterTitle: HUNTER_TITLE,
  hunterDesc: HUNTER_DESC,
  atsDesc: ATS_DESC,
  assistantRole: ASSISTANT_ROLE,
  assistantDesc: ASSISTANT_DESC,
};

/**
 * Targets that behave like text inputs. Drives both the I-beam and the focus
 * ring, so the two can never disagree about which field the cursor is in.
 */
const TEXT_FIELD_TARGETS: Record<string, string> = {
  "hunter-title": "hunterTitle",
  "hunter-desc": "hunterDesc",
  "ats-desc": "atsDesc",
  "assistant-role": "assistantRole",
  "assistant-desc": "assistantDesc",
};

type DemoState = {
  step: number;
  selectOpen: boolean;
  selected: boolean;
  typed: Record<string, string>;
  /** Field showing a focus ring: set from the click, held through the typing. */
  focusField: string | null;
  /** Field currently receiving characters, which is what shows the caret. */
  typingField: string | null;
};

const RESTING_STATE: DemoState = {
  step: 2,
  selectOpen: false,
  selected: true,
  typed: RESTING_TYPED,
  focusField: null,
  typingField: null,
};

function TourSteps({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Tour step ${step + 1} of 3`}>
      {[0, 1, 2].map((item) => (
        <span key={item} className={cn("h-1.5 rounded-full transition-all duration-300", item === step ? "w-5 bg-primary" : "w-1.5 bg-zinc-300 dark:bg-zinc-700")} />
      ))}
    </div>
  );
}

/** Text as the cursor has typed it so far, with a caret while it is the focus. */
function Typed({ value, placeholder, typing }: { value?: string; placeholder: string; typing: boolean }) {
  if (!value) return <span className="text-zinc-400 dark:text-zinc-500">{placeholder}</span>;
  return (
    <>
      {value}
      {typing ? <TypingCaret /> : null}
    </>
  );
}

function MiniSelect({
  label,
  targetKey,
  optionTargetKey,
  open,
  selected,
}: {
  label: string;
  targetKey: string;
  optionTargetKey: string;
  open: boolean;
  selected: boolean;
}) {
  return (
    <div className="relative block">
      <span className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">{label}</span>
      <span
        data-cursor-target={targetKey}
        className={cn(
          "mt-1.5 flex h-9 items-center justify-between rounded-lg border bg-white px-3 text-xs font-medium transition-colors dark:bg-zinc-950",
          open ? "border-primary ring-2 ring-primary/15" : "border-zinc-200 dark:border-zinc-700",
          selected ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-500",
        )}
      >
        {selected ? RESUME_NAME : "Select a resume"}
        <ChevronDown className={cn("size-3.5 text-zinc-400 transition-transform", open && "rotate-180")} />
      </span>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
          >
            {RESUME_OPTIONS.map((option, index) => (
              <span
                key={option}
                data-cursor-target={index === 0 ? optionTargetKey : undefined}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-[11px]",
                  index === 0 ? "bg-primary/5 font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-500",
                )}
              >
                <FileText className="size-3 shrink-0 text-zinc-400" />
                {option}
              </span>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function JobHunterPreview({ state }: { state: DemoState }) {
  const { step, typed, focusField, typingField } = state;
  return (
    <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-5 lg:items-start">
      <aside data-cursor-target="hunter-form" className="space-y-3 lg:col-span-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
          <MiniSelect label="Score against" targetKey="hunter-select" optionTargetKey="hunter-select-option" open={state.selectOpen} selected={state.selected} />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-semibold">Add a job</p>
          <div className="mt-3 flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
            <span className="flex-1 rounded-md bg-white px-2 py-1.5 text-center text-[11px] font-semibold shadow-sm dark:bg-zinc-800">Paste details</span>
            <span className="flex-1 px-2 py-1.5 text-center text-[11px] text-zinc-500">Job URL</span>
          </div>
          <p className="mt-3 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Job title</p>
          <div data-cursor-target="hunter-title" className={cn("mt-1.5 rounded-lg border px-3 py-2 text-xs transition-colors", focusField === "hunterTitle" ? "border-primary ring-2 ring-primary/15" : "border-zinc-200 dark:border-zinc-700")}>
            <Typed value={typed.hunterTitle} placeholder="Paste or type the job title" typing={typingField === "hunterTitle"} />
          </div>
          <p className="mt-2 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Job description</p>
          <div data-cursor-target="hunter-desc" className={cn("mt-1.5 min-h-16 rounded-lg border px-3 py-2 text-[11px] leading-relaxed transition-colors", focusField === "hunterDesc" ? "border-primary text-zinc-700 ring-2 ring-primary/15 dark:text-zinc-300" : "border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300")}>
            <Typed value={typed.hunterDesc} placeholder="Paste the job description..." typing={typingField === "hunterDesc"} />
          </div>
          <span data-cursor-target="hunter-submit" className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-xs font-semibold text-white"><Plus className="size-3.5" />Add and score job</span>
        </div>
      </aside>

      <div data-cursor-target="hunter-result" className="min-w-0 space-y-3 lg:col-span-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex rounded-lg bg-zinc-200/60 p-1 dark:bg-zinc-800"><span className="rounded-md bg-white px-3 py-1.5 text-[11px] font-semibold shadow-sm dark:bg-zinc-950">Jobs</span><span className="px-3 py-1.5 text-[11px] text-zinc-500">Scheduled hunts (1)</span></div>
          <div className="hidden items-center rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700 sm:flex"><span className="rounded-md bg-zinc-100 p-1.5 dark:bg-zinc-800"><List className="size-3" /></span><span className="p-1.5 text-zinc-400"><Grid className="size-3" /></span></div>
        </div>
        <div className="relative"><Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" /><div className="h-9 rounded-lg border border-zinc-200 bg-white pl-9 pt-2 text-[11px] text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950">Search title, company, location, or keyword</div></div>
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white/50 p-7 text-center dark:border-zinc-700 dark:bg-zinc-950/40"><Target className="size-7 text-zinc-400" /><p className="mt-3 text-sm font-semibold">Add a job to your pipeline</p><p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-500">Craftiv will compare the posting with your selected resume.</p></motion.div>
          ) : (
            <motion.article key="match" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-start justify-between gap-4"><div className="min-w-0"><h4 className="truncate text-sm font-semibold">Executive Virtual Assistant</h4><p className="mt-1 text-xs text-zinc-500">Northstar Commerce · Remote</p><div className="mt-2 flex gap-4 text-[11px]"><span><span className="text-zinc-400">Type </span>Full-time</span><span><span className="text-zinc-400">Hours </span>40 / week</span></div></div><div className="rounded-lg border border-success-border bg-success-surface px-3 py-2 text-center text-success-surface-foreground"><span className="block text-xl font-bold tabular-nums">86</span><span className="block text-[10px] font-semibold">Strong</span></div></div>
              <span data-cursor-target="hunter-why" className="mt-3 flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-left dark:border-zinc-800 dark:bg-zinc-900"><span><span className="block text-xs font-semibold">Why this score?</span><span className="mt-0.5 block text-[11px] text-zinc-500">6 matched and 2 missing keywords</span></span><ChevronDown className={cn("size-3.5 text-zinc-400 transition-transform", step === 2 && "rotate-180")} /></span>
              <AnimatePresence initial={false}>{step === 2 ? <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><div className="grid gap-2 pt-3 sm:grid-cols-3">{[["Keywords", "88"], ["Experience", "84"], ["Formatting", "91"]].map(([label, score]) => <div key={label} className="rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-900"><div className="flex justify-between text-[11px]"><span>{label}</span><strong>{score}</strong></div></div>)}</div><div className="mt-3 flex flex-wrap gap-1.5">{["calendar management", "CRM", "client communication"].map((keyword) => <span key={keyword} className="rounded-md border border-success-border bg-success-surface px-2 py-1 text-[10px] font-medium text-success-surface-foreground">{keyword}</span>)}</div></motion.div> : null}</AnimatePresence>
              <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-lg bg-primary px-3 py-2 text-[11px] font-semibold text-white">Tailor application</span><span className="rounded-lg border border-zinc-200 px-3 py-2 text-[11px] font-semibold dark:border-zinc-700">Move to applied</span></div>
            </motion.article>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AtsPreview({ state }: { state: DemoState }) {
  const { step, typed, focusField, typingField } = state;
  return (
    <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-5 lg:items-start">
      <aside data-cursor-target="ats-form" className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 lg:col-span-2">
        <div><p className="flex items-center gap-2 text-xs font-semibold"><span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">1</span>What should we check?</p><div className="mt-3 flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900"><span className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-2 py-1.5 text-[11px] font-semibold shadow-sm dark:bg-zinc-800"><FileText className="size-3" />Saved resume</span><span className="flex-1 px-2 py-1.5 text-center text-[11px] text-zinc-500">Upload a file</span></div><div className="mt-2"><MiniSelect label="Resume" targetKey="ats-select" optionTargetKey="ats-select-option" open={state.selectOpen} selected={state.selected} /></div></div>
        <div><p className="flex items-center gap-2 text-xs font-semibold"><span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">2</span>Target job description</p><div data-cursor-target="ats-desc" className={cn("mt-2 min-h-24 rounded-lg border px-3 py-2 text-[11px] leading-relaxed transition-colors", focusField === "atsDesc" ? "border-primary text-zinc-700 ring-2 ring-primary/15 dark:text-zinc-300" : "border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300")}><Typed value={typed.atsDesc} placeholder="Paste the job description for sharper matching..." typing={typingField === "atsDesc"} /></div></div>
        <span data-cursor-target="ats-submit" className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary text-xs font-semibold text-white">{step === 1 ? <Loader2 className="size-3.5 animate-spin" /> : <ScanSearch className="size-3.5" />}{step === 1 ? "Analyzing resume" : "Run ATS check"}</span>
      </aside>
      <div data-cursor-target="ats-result" className="min-w-0 lg:col-span-3">
        <AnimatePresence mode="wait">
          {step === 0 ? <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex min-h-[25rem] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white/50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-950/40"><span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"><ScanSearch className="size-6" /></span><p className="mt-4 text-sm font-semibold">Your report will appear here</p><p className="mt-2 max-w-xs text-xs leading-relaxed text-zinc-500">Run the check for an overall score, keyword gaps, and specific rewrites.</p></motion.div> : null}
          {step === 1 ? <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3"><div className="flex items-center gap-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"><div className="size-24 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" /><div className="flex-1 space-y-3"><div className="h-3 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" /><div className="h-8 w-36 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" /><div className="h-14 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" /></div></div><div className="h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" /><div className="h-36 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" /></motion.div> : null}
          {step === 2 ? <motion.div key="report" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3"><div className="flex items-center gap-5 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"><div className="flex size-24 shrink-0 items-center justify-center rounded-full border-[7px] border-success-border"><div className="text-center"><strong className="block text-2xl tabular-nums">86</strong><span className="text-[10px] text-zinc-500">Strong</span></div></div><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Parser compatibility</p><span className="mt-2 inline-flex items-center gap-1 rounded-md border border-success-border bg-success-surface px-2 py-1 text-[11px] font-semibold text-success-surface-foreground"><Check className="size-3" />Excellent</span><div className="mt-3 rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-900"><p className="text-[10px] font-semibold text-zinc-500">Do this first</p><p className="mt-1 text-xs font-medium">Add reporting outcomes to your latest role.</p></div></div></div><div className="flex rounded-lg bg-zinc-200/60 p-1 dark:bg-zinc-800"><span className="flex-1 rounded-md bg-white px-2 py-1.5 text-center text-[11px] font-semibold shadow-sm dark:bg-zinc-950">Overview</span><span className="flex-1 px-2 py-1.5 text-center text-[11px] text-zinc-500">Keywords 8</span><span className="flex-1 px-2 py-1.5 text-center text-[11px] text-zinc-500">Fixes 3</span></div><div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"><p className="text-xs font-semibold">Section scores</p><div className="mt-3 space-y-2">{[["Experience", "84", "Add measurable outcomes"], ["Keywords", "88", "Strong role alignment"], ["Formatting", "91", "Clean ATS reading order"]].map(([label, score, note]) => <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800"><div><p className="text-[11px] font-semibold">{label}</p><p className="text-[10px] text-zinc-500">{note}</p></div><strong className="text-xs tabular-nums">{score}</strong></div>)}</div></div></motion.div> : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AssistantPreview({ state }: { state: DemoState }) {
  const { step, typed, focusField, typingField } = state;
  return (
    <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-5 lg:items-start">
      <aside data-cursor-target="assistant-form" className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 lg:col-span-2">
        <MiniSelect label="Working on" targetKey="assistant-select" optionTargetKey="assistant-select-option" open={state.selectOpen} selected={state.selected} />
        <div><p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Target role</p><div data-cursor-target="assistant-role" className={cn("mt-1.5 rounded-lg border px-3 py-2 text-xs transition-colors", focusField === "assistantRole" ? "border-primary ring-2 ring-primary/15" : "border-zinc-200 dark:border-zinc-700")}><Typed value={typed.assistantRole} placeholder="e.g. Senior Frontend Engineer" typing={typingField === "assistantRole"} /></div></div>
        <div><p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Job description</p><div data-cursor-target="assistant-desc" className={cn("mt-1.5 min-h-24 rounded-lg border px-3 py-2 text-[11px] leading-relaxed transition-colors", focusField === "assistantDesc" ? "border-primary text-zinc-700 ring-2 ring-primary/15 dark:text-zinc-300" : "border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300")}><Typed value={typed.assistantDesc} placeholder="Paste the job description to tailor the output..." typing={typingField === "assistantDesc"} /></div></div>
      </aside>
      <div data-cursor-target="assistant-result" className="min-w-0 space-y-3 lg:col-span-3">
        <div className="flex rounded-lg bg-zinc-200/60 p-1 dark:bg-zinc-800"><span className="flex flex-1 items-center justify-center gap-1 rounded-md bg-white px-2 py-1.5 text-[11px] font-semibold shadow-sm dark:bg-zinc-950"><Sparkles className="size-3" />Resume Improver</span><span className="flex flex-1 items-center justify-center gap-1 px-2 py-1.5 text-[11px] text-zinc-500"><Target className="size-3" />Keywords</span><span className="hidden flex-1 items-center justify-center gap-1 px-2 py-1.5 text-[11px] text-zinc-500 sm:flex"><Trophy className="size-3" />Achievements</span></div>
        <p className="text-[11px] text-zinc-500">Rewrite your summary, experience, or the whole resume.</p>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"><p className="text-xs font-semibold">Goal</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{[["Rewrite summary", FileText], ["Improve experience", Briefcase], ["Full resume", Sparkles]].map(([label, Icon], index) => { const GoalIcon = Icon as typeof FileText; return <div key={label as string} className={cn("rounded-lg border p-3", index === 1 ? "border-primary bg-primary/5" : "border-zinc-200 dark:border-zinc-700")}><GoalIcon className={cn("size-3.5", index === 1 ? "text-primary" : "text-zinc-400")} /><span className="mt-2 block text-[11px] font-semibold">{label as string}</span></div>; })}</div><span data-cursor-target="assistant-submit" className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-white">{step === 1 ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}{step === 1 ? "Improving" : "Improve resume"}</span></div>
        <AnimatePresence mode="wait">
          {step === 0 ? <motion.div key="current" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"><p className="text-xs font-semibold">Current experience</p><p className="mt-2 text-xs leading-relaxed text-zinc-500">Helped my manager with schedules, emails, CRM updates, and weekly tasks.</p></motion.div> : null}
          {step === 1 ? <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"><div className="h-9 animate-pulse bg-zinc-100 dark:bg-zinc-800" /><div className="space-y-2 p-4"><div className="h-3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" /><div className="h-3 w-11/12 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" /><div className="h-3 w-4/5 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" /></div></motion.div> : null}
          {step === 2 ? <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-xl border border-primary/35 bg-white dark:bg-zinc-950"><div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900"><p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Experience · Executive Assistant</p><span className="inline-flex items-center gap-1 text-[11px] font-semibold"><Check className="size-3" />Apply</span></div><div className="p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Before</p><p className="mt-1.5 text-xs leading-relaxed text-zinc-500">Helped my manager with schedules, emails, CRM updates, and weekly tasks.</p></div><div className="border-t border-success-border bg-success-surface/50 p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-success-surface-foreground">After</p><p className="mt-1.5 text-xs font-medium leading-relaxed">Coordinated executive calendars, client communication, and CRM updates across a remote team, keeping weekly priorities on schedule.</p></div></motion.div> : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function FeatureDemo() {
  const [active, setActive] = useState<FeatureId>("hunter");
  const [beatIndex, setBeatIndex] = useState(0);
  const [typed, setTyped] = useState<Record<string, string>>({});
  const [playing, setPlaying] = useState(true);
  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);

  const activeIndex = features.findIndex((feature) => feature.id === active);
  const activeFeature = features[activeIndex] ?? features[0];

  const script = SCRIPTS[active];
  const beat = script[Math.min(beatIndex, script.length - 1)];
  const isAnimating = playing && !reduceMotion;

  const targetField = beat.target ? (TEXT_FIELD_TARGETS[beat.target] ?? null) : null;
  const state: DemoState = reduceMotion
    ? RESTING_STATE
    : {
        step: beat.step,
        selectOpen: Boolean(beat.selectOpen),
        selected: Boolean(beat.selected),
        typed,
        // Focus starts at the press and persists while typing; merely hovering
        // the field does not ring it, which is how a real input behaves.
        focusField:
          targetField && (beat.action === "click" || beat.action === "type") ? targetField : null,
        typingField: beat.action === "type" && playing ? (beat.field ?? null) : null,
      };

  // Advances the storyboard. State is only ever set from the timer callback, so
  // no render is triggered synchronously from the effect body.
  useEffect(() => {
    if (!isAnimating) return;
    const timer = window.setTimeout(() => {
      if (beatIndex + 1 < script.length) {
        setBeatIndex(beatIndex + 1);
        return;
      }
      setActive(features[(activeIndex + 1) % features.length].id);
      setBeatIndex(0);
      setTyped({});
    }, beat.ms);
    return () => window.clearTimeout(timer);
  }, [activeIndex, beat.ms, beatIndex, isAnimating, script.length]);

  // Types the current field one character at a time across the beat's duration.
  useEffect(() => {
    if (!isAnimating || beat.action !== "type" || !beat.field || !beat.text) return;
    const field = beat.field;
    const text = beat.text;
    const perCharacter = Math.max(12, beat.ms / Math.max(text.length, 1));

    let index = 0;
    const ticker = window.setInterval(() => {
      index += 1;
      setTyped((previous) => ({ ...previous, [field]: text.slice(0, index) }));
      if (index >= text.length) window.clearInterval(ticker);
    }, perCharacter);

    return () => window.clearInterval(ticker);
  }, [beat.action, beat.field, beat.ms, beat.text, isAnimating]);

  const cursorPoint = useCursorTarget(stageRef, isAnimating ? (beat.target ?? null) : null, beatIndex);

  // Framing. The zoom is clamped to the stage's own edges so a push-in can
  // never reveal blank space beyond the panel, and it resolves to the identity
  // transform at zoom 1 rather than re-centring an unzoomed stage.
  const stageSize = useElementSize(stageRef);
  /**
   * How much of a beat's zoom the stage can afford, judged on the stage's own
   * width rather than the viewport.
   *
   * The two-column desktop layout has somewhere to push in to. Below `lg` the
   * previews collapse to a single full-width column, so magnifying it only
   * crops the edges off -- labels and field text ran off the left on phones.
   * Damping through a middle band avoids a visible jump at the boundary.
   */
  const zoomAllowance = stageSize.width >= 1180 ? 1 : stageSize.width >= 900 ? 0.5 : 0;
  const zoom = isAnimating ? 1 + ((beat.zoom ?? 1) - 1) * zoomAllowance : 1;
  const zoomPoint = useCursorTarget(
    stageRef,
    isAnimating && zoom > 1 ? (beat.zoomTarget ?? beat.target ?? null) : null,
    beatIndex,
  );
  const frame = (() => {
    const { width, height } = stageSize;
    if (zoom <= 1 || !zoomPoint || width === 0 || height === 0) return { x: 0, y: 0 };
    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max);
    return {
      x: clamp(width / 2 - zoomPoint.x * zoom, width - width * zoom, 0),
      y: clamp(height / 2 - zoomPoint.y * zoom, height - height * zoom, 0),
    };
  })();

  function selectFeature(id: FeatureId) {
    setActive(id);
    setBeatIndex(0);
    setTyped({});
  }

  return (
    <section id="features" className="relative bg-white py-20 font-sans dark:bg-zinc-950 lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl"><h2 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl lg:text-5xl">One workspace for the whole job search</h2><p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg">Find better-fit roles, check every application, and improve your resume with focused AI help.</p></div>
        {/* The bottom of the card dissolves into the page. This is a mask rather
            than a white overlay on top: an overlay cannot fade the side borders,
            which kept running to the bottom edge and stopping dead. Masking the
            element fades its borders and content together, and because it fades
            to transparent it needs no colour of its own -- the page background
            shows through, correct in light and dark alike. */}
        <div className="mt-10 overflow-hidden rounded-t-2xl border-x border-t border-zinc-200 bg-zinc-50 [-webkit-mask-image:linear-gradient(to_bottom,#000_calc(100%-13rem),transparent_100%)] [mask-image:linear-gradient(to_bottom,#000_calc(100%-13rem),transparent_100%)] dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950 sm:px-4">
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-2 scrollbar-none" role="tablist" aria-label="Craftiv product tour">{features.map((feature) => { const Icon = feature.icon; const selected = feature.id === active; return <button key={feature.id} type="button" role="tab" aria-selected={selected} onClick={() => selectFeature(feature.id)} className={cn("inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition active:translate-y-px sm:text-sm", selected ? "bg-primary text-white" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100")}><Icon className="size-4" />{feature.name}</button>; })}</div>
            <button type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pause autoplay" : "Play autoplay"} className="hidden shrink-0 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 active:translate-y-px dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900 sm:inline-flex">{playing ? <span className="flex gap-0.5"><span className="h-3 w-0.5 rounded bg-current" /><span className="h-3 w-0.5 rounded bg-current" /></span> : <Play className="size-3.5" />}{playing ? "Pause" : "Play"}</button>
          </div>
          <div className="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950 sm:flex sm:items-center sm:justify-between sm:px-5"><div><h3 className="text-base font-semibold">{activeFeature.name}</h3><p className="mt-1 max-w-3xl text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-sm">{activeFeature.description}</p></div><div className="mt-3 flex items-center justify-between gap-4 sm:mt-0 sm:justify-end"><TourSteps step={state.step} /><Link href={activeFeature.href} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-primary hover:underline dark:text-zinc-200">{activeFeature.cta}<ArrowRight className="size-3.5" /></Link></div></div>
          <div className="relative min-h-[38rem] overflow-hidden bg-zinc-50 dark:bg-zinc-900 sm:min-h-[35rem]">
            {/* The ref sits on the transformed element, not its parent, so the
                cursor and the framing share one coordinate space. */}
            <motion.div
              ref={stageRef}
              className="relative origin-top-left"
              initial={false}
              animate={{ scale: zoom, x: frame.x, y: frame.y }}
              transition={{ type: "spring", stiffness: 55, damping: 20, mass: 1 }}
            >
            <AnimatePresence mode="wait" initial={false}><motion.div key={active} initial={reduceMotion ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: -12 }} transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}>{active === "hunter" ? <JobHunterPreview state={state} /> : null}{active === "ats" ? <AtsPreview state={state} /> : null}{active === "assistant" ? <AssistantPreview state={state} /> : null}</motion.div></AnimatePresence>
              <DemoCursor point={cursorPoint} clicking={isAnimating && beat.action === "click"} clickKey={beatIndex} variant={targetField ? "text" : "arrow"} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
