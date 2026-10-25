"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
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
  Upload,
} from "@/components/ui/icons";
import {
  DemoCursor,
  TypingCaret,
  useCursorTarget,
  useElementSize,
} from "@/components/feature-demo-cursor";
import { cn } from "@/lib/utils";
import { BlurFade } from "@/components/ui/blur-fade";
import { BlurInText } from "@/components/ui/blur-in-text";

type FeatureId = "create" | "hunter" | "ats" | "assistant";

const features = [
  {
    id: "create" as const,
    name: "Create a resume",
    description: "Pick a template, fill in your details while the preview updates, then share it as a link and see when it is opened.",
    href: "/resume/templates",
    cta: "Browse templates",
    icon: FileText,
  },
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
const CREATE_FIRST = "Angela";
const CREATE_LAST = "Reyes";
const CREATE_TITLE = "Executive Virtual Assistant";
const SHARE_URL = "gocraftiv.com/r/k3f9xq2m";
// Real template previews from the picker, in its order.
const CREATE_TEMPLATES = [
  { id: "harvard", name: "Harvard" },
  { id: "classic", name: "Classic" },
  { id: "metro", name: "Metro" },
];

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
  // The real path: template picker, the Contacts step of the editor, then the finished resume.
  // selectOpen here is the "Use this template" hover overlay.
  create: [
    { target: "create-template", ms: 900, step: 0, zoom: 1.25, zoomTarget: "create-picker" },
    { target: "create-template", ms: 650, step: 0, selectOpen: true, zoom: 1.25, zoomTarget: "create-picker" },
    { target: "create-use", ms: 450, step: 0, selectOpen: true, zoom: 1.25, zoomTarget: "create-picker" },
    { target: "create-use", action: "click", ms: 450, step: 0, selectOpen: true, zoom: 1.25, zoomTarget: "create-picker" },
    { target: "create-first", ms: 700, step: 1, zoom: 1.3, zoomTarget: "create-form" },
    { target: "create-first", action: "click", ms: 340, step: 1, zoom: 1.3, zoomTarget: "create-form" },
    { target: "create-first", action: "type", field: "createFirst", text: CREATE_FIRST, ms: 650, step: 1, zoom: 1.3, zoomTarget: "create-form" },
    { target: "create-last", ms: 420, step: 1, zoom: 1.3, zoomTarget: "create-form" },
    { target: "create-last", action: "click", ms: 340, step: 1, zoom: 1.3, zoomTarget: "create-form" },
    { target: "create-last", action: "type", field: "createLast", text: CREATE_LAST, ms: 600, step: 1, zoom: 1.3, zoomTarget: "create-form" },
    { target: "create-title", ms: 420, step: 1, zoom: 1.3, zoomTarget: "create-form" },
    { target: "create-title", action: "click", ms: 340, step: 1, zoom: 1.3, zoomTarget: "create-form" },
    { target: "create-title", action: "type", field: "createTitle", text: CREATE_TITLE, ms: 1300, step: 1, zoom: 1.3, zoomTarget: "create-form" },
    { target: "create-preview", ms: 1800, step: 1 },
    { target: "create-next", ms: 520, step: 1 },
    { target: "create-next", action: "click", ms: 440, step: 1 },
    // Then the finished resume: Share, switch the public link on, copy it, and watch the view land.
    // From here, selected is the Public link switch.
    { target: "share-open", ms: 1000, step: 2 },
    { target: "share-open", action: "click", ms: 440, step: 2 },
    { target: "share-switch", ms: 700, step: 3, zoom: 1.3, zoomTarget: "share-dialog" },
    { target: "share-switch", action: "click", ms: 420, step: 3, zoom: 1.3, zoomTarget: "share-dialog" },
    { target: "share-copy", ms: 800, step: 3, selected: true, zoom: 1.3, zoomTarget: "share-dialog" },
    { target: "share-copy", action: "click", ms: 440, step: 3, selected: true, zoom: 1.3, zoomTarget: "share-dialog" },
    { target: "share-copy", ms: 1400, step: 4, selected: true, zoom: 1.3, zoomTarget: "share-dialog" },
    { target: "share-views", ms: 2400, step: 5, selected: true, zoom: 1.3, zoomTarget: "share-dialog" },
  ],
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
  createFirst: CREATE_FIRST,
  createLast: CREATE_LAST,
  createTitle: CREATE_TITLE,
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
  "create-first": "createFirst",
  "create-last": "createLast",
  "create-title": "createTitle",
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
  // The create tour runs on into sharing; its later beats share the last dot.
  const dot = Math.min(step, 2);
  return (
    <div className="flex items-center gap-1.5" aria-label={`Tour step ${dot + 1} of 3`}>
      {[0, 1, 2].map((item) => (
        <span key={item} className={cn("h-1.5 rounded-full transition-all duration-300", item === dot ? "w-5 bg-primary" : "w-1.5 bg-zinc-300 dark:bg-zinc-700")} />
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
              <div className="flex items-start justify-between gap-4"><div className="min-w-0"><h4 className="truncate text-sm font-semibold">Executive Virtual Assistant</h4><p className="mt-1 text-xs text-zinc-500">Northstar Commerce · Remote</p><div className="mt-2 flex gap-4 text-[11px]"><span><span className="text-zinc-400">Type </span>Full-time</span><span><span className="text-zinc-400">Hours </span>40 / week</span></div></div><div className="rounded-lg bg-success-surface px-3 py-2 text-center text-success-surface-foreground"><span className="block text-xl font-bold tabular-nums">86</span><span className="block text-[10px] font-semibold">Strong</span></div></div>
              <span data-cursor-target="hunter-why" className="mt-3 flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-left dark:border-zinc-800 dark:bg-zinc-900"><span><span className="block text-xs font-semibold">Why this score?</span><span className="mt-0.5 block text-[11px] text-zinc-500">6 matched and 2 missing keywords</span></span><ChevronDown className={cn("size-3.5 text-zinc-400 transition-transform", step === 2 && "rotate-180")} /></span>
              <AnimatePresence initial={false}>{step === 2 ? <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><div className="grid gap-2 pt-3 sm:grid-cols-3">{[["Keywords", "88"], ["Experience", "84"], ["Formatting", "91"]].map(([label, score]) => <div key={label} className="rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-900"><div className="flex justify-between text-[11px]"><span>{label}</span><strong>{score}</strong></div></div>)}</div><div className="mt-3 flex flex-wrap gap-1.5">{["calendar management", "CRM", "client communication"].map((keyword) => <span key={keyword} className="rounded-md bg-success-surface px-2 py-1 text-[10px] font-medium text-success-surface-foreground">{keyword}</span>)}</div></motion.div> : null}</AnimatePresence>
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
          {step === 2 ? <motion.div key="report" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3"><div className="flex items-center gap-5 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"><div className="flex size-24 shrink-0 items-center justify-center rounded-full border-[7px] border-success-border"><div className="text-center"><strong className="block text-2xl tabular-nums">86</strong><span className="text-[10px] text-zinc-500">Strong</span></div></div><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Parser compatibility</p><span className="mt-2 inline-flex items-center gap-1 rounded-md bg-success-surface px-2 py-1 text-[11px] font-semibold text-success-surface-foreground"><Check className="size-3" />Excellent</span><div className="mt-3 rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-900"><p className="text-[10px] font-semibold text-zinc-500">Do this first</p><p className="mt-1 text-xs font-medium">Add reporting outcomes to your latest role.</p></div></div></div><div className="flex rounded-lg bg-zinc-200/60 p-1 dark:bg-zinc-800"><span className="flex-1 rounded-md bg-white px-2 py-1.5 text-center text-[11px] font-semibold shadow-sm dark:bg-zinc-950">Overview</span><span className="flex-1 px-2 py-1.5 text-center text-[11px] text-zinc-500">Keywords 8</span><span className="flex-1 px-2 py-1.5 text-center text-[11px] text-zinc-500">Fixes 3</span></div><div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"><p className="text-xs font-semibold">Section scores</p><div className="mt-3 space-y-2">{[["Experience", "84", "Add measurable outcomes"], ["Keywords", "88", "Strong role alignment"], ["Formatting", "91", "Clean ATS reading order"]].map(([label, score, note]) => <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800"><div><p className="text-[11px] font-semibold">{label}</p><p className="text-[10px] text-zinc-500">{note}</p></div><strong className="text-xs tabular-nums">{score}</strong></div>)}</div></div></motion.div> : null}
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

const RESUME_STEPS = ["Contacts", "Experience", "Education", "Skills", "Summary", "Finalize"];
const RESUME_EMAIL = "angela.reyes@email.com";
const RESUME_PHONE = "+63 917 555 0142";

/** The resume as the editor's live preview draws it: name and title fill in as they are typed. */
// What the rest of the resume holds once the contact details are in. The tour skips typing these.
const RESUME_BODY = {
  summary:
    "Executive virtual assistant with 5 years supporting founders and leadership teams remotely. Keeps calendars, inboxes and projects running across time zones.",
  experience: [
    {
      role: "Executive Virtual Assistant",
      org: "Northwind Partners · Remote",
      dates: "2022 - Present",
      bullets: [
        "Managed calendars and travel for 3 executives across 4 time zones",
        "Cut scheduling conflicts by 40% with a shared booking system",
        "Prepared weekly board packs and meeting notes for the leadership team",
        "Triaged 200+ emails a day, drafting replies for executive sign-off",
      ],
    },
    {
      role: "Administrative Assistant",
      org: "Brightline Health · Manila",
      dates: "2019 - 2022",
      bullets: [
        "Kept CRM records and weekly reports up to date for a 12-person sales team",
        "Coordinated onboarding for 30 new hires, from accounts to first-week schedules",
        "Rebuilt the shared drive filing system, halving time spent finding documents",
      ],
    },
    {
      role: "Customer Support Associate",
      org: "Atlas BPO · Quezon City",
      dates: "2017 - 2019",
      bullets: ["Resolved 60+ customer tickets a day with a 96% satisfaction score"],
    },
  ],
  education: { degree: "BS Business Administration", school: "University of Santo Tomas", dates: "2013 - 2017" },
  certifications: ["Google Workspace Administrator", "HubSpot CRM Certified"],
  languages: ["English (Fluent)", "Filipino (Native)"],
  skills: ["Calendar management", "Google Workspace", "HubSpot CRM", "Travel planning", "Client communication", "Notion", "Slack", "Data entry"],
};

function MiniResume({
  first,
  last,
  title,
  typing,
  filled,
  withScore,
}: {
  first?: string;
  last?: string;
  title?: string;
  typing?: string | null;
  /** Show the full resume body instead of placeholder lines. */
  filled?: boolean;
  /** The editor's "Profile completeness" bar above the page. */
  withScore?: boolean;
}) {
  const name = [first, last].filter(Boolean).join(" ");
  // Same points as calculateScore in resume-preview: 4 per contact field (email and phone are pre-filled here),
  // then described jobs (25), 3+ skills (15), a 50+ character summary (15), education (15), languages (2) and certifications (3).
  const score = 8 + [first, last, title].filter(Boolean).length * 4 + (filled ? 75 : 0);
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-[0_16px_32px_-20px_rgb(24_24_27/0.35)] dark:bg-zinc-950">
      {withScore ? (
        <div className="flex items-center gap-2 border-b bg-gray-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="rounded bg-cyan-500 px-1.5 py-0.5 text-[9px] font-bold text-white tabular-nums">{score}%</span>
          <span className="text-[10px] text-gray-600 dark:text-zinc-400">Profile completeness</span>
        </div>
      ) : null}
      <div className="p-4">
      <p className="text-center text-base font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-100">
        {name || <span className="text-zinc-900 dark:text-zinc-100">Your Name</span>}
        {typing === "createFirst" || typing === "createLast" ? <TypingCaret /> : null}
      </p>
      <p className="mt-0.5 text-center text-[10px] text-zinc-500">
        {title}
        {typing === "createTitle" ? <TypingCaret /> : null}
      </p>
      {title || name ? <p className="mt-1 text-center text-[9px] text-zinc-400">{RESUME_EMAIL} · {RESUME_PHONE}</p> : null}
      {filled ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <p className="mt-3 border-b border-zinc-200 pb-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">Summary</p>
          <p className="mt-1.5 text-[9px] leading-relaxed text-zinc-600 dark:text-zinc-400">{RESUME_BODY.summary}</p>
          <p className="mt-3 border-b border-zinc-200 pb-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">Experience</p>
          {RESUME_BODY.experience.map((job) => (
            <div key={job.role} className="mt-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[9px] font-semibold text-zinc-800 dark:text-zinc-200">{job.role}</p>
                <p className="shrink-0 text-[8px] text-zinc-400">{job.dates}</p>
              </div>
              <p className="text-[8px] text-zinc-500">{job.org}</p>
              <ul className="mt-0.5 list-disc space-y-0.5 pl-3 text-[8px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                {job.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
          <p className="mt-3 border-b border-zinc-200 pb-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">Skills</p>
          <p className="mt-1.5 text-[8px] leading-relaxed text-zinc-600 dark:text-zinc-400">{RESUME_BODY.skills.join(" · ")}</p>
          <p className="mt-3 border-b border-zinc-200 pb-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">Education</p>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <p className="text-[9px] font-semibold text-zinc-800 dark:text-zinc-200">{RESUME_BODY.education.degree}</p>
            <p className="shrink-0 text-[8px] text-zinc-400">{RESUME_BODY.education.dates}</p>
          </div>
          <p className="text-[8px] text-zinc-500">{RESUME_BODY.education.school}</p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <p className="border-b border-zinc-200 pb-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">Certifications</p>
              <p className="mt-1.5 text-[8px] leading-relaxed text-zinc-600 dark:text-zinc-400">{RESUME_BODY.certifications.join(" · ")}</p>
            </div>
            <div>
              <p className="border-b border-zinc-200 pb-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">Languages</p>
              <p className="mt-1.5 text-[8px] leading-relaxed text-zinc-600 dark:text-zinc-400">{RESUME_BODY.languages.join(" · ")}</p>
            </div>
          </div>
        </motion.div>
      ) : (
        ["Summary", "Experience", "Skills"].map((section) => (
          <div key={section} className="mt-3">
            <p className="border-b border-zinc-200 pb-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">{section}</p>
            <div className="mt-1.5 space-y-1">
              <div className="h-1.5 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-1.5 w-5/6 rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
        ))
      )}
      </div>
    </div>
  );
}

function CreatePreview({ state }: { state: DemoState }) {
  const { step, typed, focusField, typingField } = state;
  const filled = typed.createTitle === CREATE_TITLE && typingField !== "createTitle";
  const field = (key: string, target: string, label: string, placeholder: string) => (
    <div>
      <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">{label}</p>
      <div
        data-cursor-target={target}
        className={cn(
          "mt-1.5 rounded-lg border px-3 py-2 text-xs transition-colors",
          focusField === key ? "border-primary bg-white ring-2 ring-primary/15 dark:bg-zinc-950" : "border-transparent bg-zinc-100 dark:bg-zinc-900",
        )}
      >
        <Typed value={typed[key]} placeholder={placeholder} typing={typingField === key} />
      </div>
    </div>
  );
  return (
    <AnimatePresence mode="wait" initial={false}>
      {step === 0 ? (
        <motion.div key="picker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-cursor-target="create-picker" className="p-4 sm:p-5">
          <div className="flex items-center justify-center gap-3 text-[11px]">
            {["Choose template", "Enter your details", "Download resume"].map((label, i) => (
              <span key={label} className="flex items-center gap-2">
                {i > 0 ? <span className="h-px w-6 bg-zinc-200 dark:bg-zinc-700" /> : null}
                <span className={cn("flex size-5 items-center justify-center rounded-full text-[10px] font-semibold", i === 0 ? "bg-primary text-white" : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800")}>{i + 1}</span>
                <span className={cn("hidden sm:inline", i === 0 ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-500")}>{label}</span>
              </span>
            ))}
          </div>
          <p className="mt-5 text-center font-display text-xl font-bold">Resume templates</p>
          <div className="mt-3 flex justify-center gap-4 border-b border-zinc-200 text-[11px] dark:border-zinc-800">
            {["All Templates", "Simple", "Modern", "Professional", "ATS Friendly", "Creative"].map((tab, i) => (
              <span key={tab} className={cn("pb-2", i === 0 ? "border-b-2 border-primary font-semibold text-zinc-900 dark:text-zinc-100" : "hidden text-zinc-500 sm:inline")}>{tab}</span>
            ))}
          </div>
          <div className="mx-auto mt-4 grid max-w-2xl grid-cols-3 gap-3">
            {CREATE_TEMPLATES.map((template, i) => (
              <div key={template.id} data-cursor-target={i === 0 ? "create-template" : undefined} className="relative overflow-hidden rounded-lg bg-white shadow-sm dark:bg-zinc-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/resume-templates/${template.id}.webp`} alt="" className="aspect-[3/4] w-full object-cover object-top" loading="lazy" />
                <AnimatePresence>
                  {i === 0 && state.selectOpen ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span data-cursor-target="create-use" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[11px] font-semibold text-white">
                        <FileText className="size-3.5" />
                        Use this template
                      </span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <span className="absolute inset-x-0 bottom-0 bg-white/95 px-2 py-1 text-[10px] font-medium text-zinc-700 dark:bg-zinc-950/95 dark:text-zinc-300">{template.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      ) : step === 1 ? (
        <motion.div key="editor" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="bg-white dark:bg-zinc-950">
          {/* Same chrome as the real editor (app/resume/section): back link, title, saved state, preview toggle. */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                <ChevronLeft className="size-3" />
                Dashboard
              </span>
              <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
              <span className="font-display text-sm font-bold">Create Your Resume</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                <Check className="size-3 text-emerald-600" />
                Saved
              </span>
              <span className="hidden rounded-full border border-zinc-200 px-2.5 py-1 text-[10px] font-medium sm:inline dark:border-zinc-700">Hide Preview</span>
            </div>
          </div>
          <div className="grid lg:grid-cols-2">
            <div data-cursor-target="create-form" className="border-zinc-200 lg:border-r dark:border-zinc-800">
              <div className="flex items-start justify-between border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
                {RESUME_STEPS.map((label, i) => (
                  <span key={label} className="flex flex-col items-center gap-1">
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full text-[9px] font-semibold",
                        i === 0 ? "bg-primary text-white" : "border border-zinc-300 text-zinc-500 dark:border-zinc-700",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className={cn("text-[9px]", i === 0 ? "font-medium text-primary" : "text-zinc-500")}>{label}</span>
                  </span>
                ))}
              </div>
              <div className="px-6 py-4">
                <p className="font-display text-lg font-bold">Contact Information</p>
                <p className="mt-0.5 text-[10px] text-zinc-500">Let employers know how to reach you. This information will appear at the top of your resume.</p>
                <div className="mt-3 flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
                  <span>
                    <span className="block text-[10px] font-medium">Show Profile Photo</span>
                    <span className="block text-[9px] text-zinc-500">Turn this on to upload and display a photo in your resume.</span>
                  </span>
                  <span className="flex h-4 w-7 items-center rounded-full bg-primary p-0.5">
                    <span className="size-3 translate-x-3 rounded-full bg-white" />
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full border border-dashed border-zinc-300 text-zinc-400 dark:border-zinc-700">
                    <Upload className="size-3.5" />
                  </span>
                  <span>
                    <span className="block text-[10px] font-medium">Upload your photo</span>
                    <span className="block text-[9px] text-zinc-500">Recommended: Square image, max 5MB. Accepts JPG, PNG, or GIF.</span>
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {field("createFirst", "create-first", "First Name", "John")}
                  {field("createLast", "create-last", "Last Name", "Doe")}
                </div>
                <div className="mt-2.5">
                  {field("createTitle", "create-title", "Desired Job Title", "e.g. Software Engineer, Product Manager, UX Designer")}
                  <p className="mt-1 text-[9px] text-zinc-500">This will appear prominently on your resume and help recruiters understand your target role.</p>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">Phone Number</p>
                    <div className="mt-1.5 rounded-lg bg-zinc-100 px-3 py-2 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">{RESUME_PHONE}</div>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">Email Address</p>
                    <div className="mt-1.5 truncate rounded-lg bg-zinc-100 px-3 py-2 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">{RESUME_EMAIL}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-200 px-5 py-2.5 dark:border-zinc-800">
                <span className="rounded-full px-3 py-1.5 text-[11px] text-zinc-400">Back</span>
                <span data-cursor-target="create-next" className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-[11px] font-semibold text-white">
                  Next
                  <ChevronRight className="size-3" />
                </span>
              </div>
            </div>
            <div data-cursor-target="create-preview" className="hidden bg-zinc-50 p-5 lg:block dark:bg-zinc-900">
              <MiniResume first={typed.createFirst} last={typed.createLast} title={typed.createTitle} typing={typingField} filled={filled} withScore />
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div key="final" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <SharePreview state={{ ...state, step: step - 2 }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SharePreview({ state }: { state: DemoState }) {
  const { step, selected } = state;
  return (
    <div className="relative min-h-[38rem] p-4 sm:min-h-[35rem] sm:p-5">
      <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 dark:bg-zinc-950">
        <p className="text-xs font-semibold">Angela - Virtual Assistant</p>
        <div className="flex gap-2">
          <span data-cursor-target="share-open" className="rounded-lg border border-zinc-200 px-3 py-1.5 text-[11px] font-semibold dark:border-zinc-700">Share</span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-white"><Download className="size-3" />Download Resume</span>
        </div>
      </div>
      <div className="mx-auto mt-4 max-w-sm">
        <MiniResume first={CREATE_FIRST} last={CREATE_LAST} title={CREATE_TITLE} filled />
      </div>
      <AnimatePresence>
        {step >= 1 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-start justify-center bg-zinc-900/30 pt-10">
            <motion.div
              data-cursor-target="share-dialog"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-[22rem] max-w-[90%] rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-950"
            >
              <p className="text-sm font-semibold">Share your resume</p>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">Anyone with the link can view this resume. It updates as you edit and is hidden from search engines.</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-medium">Public link</span>
                <span data-cursor-target="share-switch" className={cn("flex h-5 w-9 items-center rounded-full p-0.5 transition-colors", selected ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-700")}>
                  <span className={cn("size-4 rounded-full bg-white shadow transition-transform", selected && "translate-x-4")} />
                </span>
              </div>
              <AnimatePresence initial={false}>
                {selected ? (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                    <div className="mt-4 flex gap-2">
                      <span className="min-w-0 flex-1 truncate rounded-lg border border-zinc-200 px-3 py-2 text-[11px] text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">{SHARE_URL}</span>
                      <span data-cursor-target="share-copy" className="flex size-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700">
                        {step >= 2 ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
                      </span>
                    </div>
                    <div data-cursor-target="share-views" className="mt-3 grid grid-cols-2 gap-2">
                      {["Total views", "Last 30 days"].map((label) => (
                        <div key={label} className="rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-700">
                          <AnimatePresence mode="popLayout" initial={false}>
                            <motion.p key={step >= 3 ? 1 : 0} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-lg font-semibold tabular-nums">
                              {step >= 3 ? 1 : 0}
                            </motion.p>
                          </AnimatePresence>
                          <p className="text-[10px] text-zinc-500">{label}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] leading-relaxed text-zinc-500">
                      {step >= 3 ? "Last viewed just now." : "No views yet."} Each visitor counts once a day; your own views don&apos;t count.
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {step === 2 ? (
          <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-6 right-6 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-[11px] font-medium shadow-lg dark:bg-zinc-950">
            <Check className="size-3.5 text-success-surface-foreground" />
            Link copied.
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function FeatureDemo() {
  const [active, setActive] = useState<FeatureId>("create");
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
        <div className="max-w-3xl"><h2 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl lg:text-5xl"><BlurInText text="One workspace for the whole job search" /></h2><p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg"><BlurInText text="Find better-fit roles, check every application, and improve your resume with focused AI help." delay={0.4} stagger={0.01} /></p></div>
        {/* The bottom of the card dissolves into the page. This is a mask rather
            than a white overlay on top: an overlay cannot fade the side borders,
            which kept running to the bottom edge and stopping dead. Masking the
            element fades its borders and content together, and because it fades
            to transparent it needs no colour of its own -- the page background
            shows through, correct in light and dark alike. */}
        <BlurFade delay={0.2}>
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
            <AnimatePresence mode="wait" initial={false}><motion.div key={active} initial={reduceMotion ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: -12 }} transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}>{active === "hunter" ? <JobHunterPreview state={state} /> : null}{active === "ats" ? <AtsPreview state={state} /> : null}{active === "assistant" ? <AssistantPreview state={state} /> : null}{active === "create" ? <CreatePreview state={state} /> : null}</motion.div></AnimatePresence>
              <DemoCursor point={cursorPoint} clicking={isAnimating && beat.action === "click"} clickKey={beatIndex} variant={targetField ? "text" : "arrow"} />
            </motion.div>
          </div>
        </div>
        </BlurFade>
      </div>
    </section>
  );
}
