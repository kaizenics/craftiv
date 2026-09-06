"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
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

function TourSteps({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Tour step ${step + 1} of 3`}>
      {[0, 1, 2].map((item) => (
        <span key={item} className={cn("h-1.5 rounded-full transition-all duration-300", item === step ? "w-5 bg-primary" : "w-1.5 bg-zinc-300 dark:bg-zinc-700")} />
      ))}
    </div>
  );
}

function MiniSelect({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">{label}</span>
      <span className="mt-1.5 flex h-9 items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
        {value}<ChevronDown className="size-3.5 text-zinc-400" />
      </span>
    </label>
  );
}

function JobHunterPreview({ step, onStep }: { step: number; onStep: (value: number) => void }) {
  return (
    <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-5 lg:items-start">
      <aside className="space-y-3 lg:col-span-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
          <MiniSelect label="Score against" value="Angela - Virtual Assistant" />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-semibold">Add a job</p>
          <div className="mt-3 flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
            <span className="flex-1 rounded-md bg-white px-2 py-1.5 text-center text-[11px] font-semibold shadow-sm dark:bg-zinc-800">Paste details</span>
            <span className="flex-1 px-2 py-1.5 text-center text-[11px] text-zinc-500">Job URL</span>
          </div>
          <p className="mt-3 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Job title</p>
          <div className="mt-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs dark:border-zinc-700">Executive Virtual Assistant</div>
          <p className="mt-2 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Job description</p>
          <div className="mt-1.5 min-h-16 rounded-lg border border-zinc-200 px-3 py-2 text-[11px] leading-relaxed text-zinc-500 dark:border-zinc-700">Manage calendars, CRM updates, client email, and weekly reporting for a remote leadership team.</div>
          <button type="button" onClick={() => onStep(1)} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-xs font-semibold text-white active:translate-y-px"><Plus className="size-3.5" />Add and score job</button>
        </div>
      </aside>

      <div className="min-w-0 space-y-3 lg:col-span-3">
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
              <button type="button" onClick={() => onStep(step === 2 ? 1 : 2)} className="mt-3 flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-left dark:border-zinc-800 dark:bg-zinc-900"><span><span className="block text-xs font-semibold">Why this score?</span><span className="mt-0.5 block text-[11px] text-zinc-500">6 matched and 2 missing keywords</span></span><ChevronDown className={cn("size-3.5 text-zinc-400 transition-transform", step === 2 && "rotate-180")} /></button>
              <AnimatePresence initial={false}>{step === 2 ? <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><div className="grid gap-2 pt-3 sm:grid-cols-3">{[["Keywords", "88"], ["Experience", "84"], ["Formatting", "91"]].map(([label, score]) => <div key={label} className="rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-900"><div className="flex justify-between text-[11px]"><span>{label}</span><strong>{score}</strong></div></div>)}</div><div className="mt-3 flex flex-wrap gap-1.5">{["calendar management", "CRM", "client communication"].map((keyword) => <span key={keyword} className="rounded-md border border-success-border bg-success-surface px-2 py-1 text-[10px] font-medium text-success-surface-foreground">{keyword}</span>)}</div></motion.div> : null}</AnimatePresence>
              <div className="mt-4 flex flex-wrap gap-2"><button type="button" className="rounded-lg bg-primary px-3 py-2 text-[11px] font-semibold text-white">Tailor application</button><button type="button" className="rounded-lg border border-zinc-200 px-3 py-2 text-[11px] font-semibold dark:border-zinc-700">Move to applied</button></div>
            </motion.article>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AtsPreview({ step, onStep }: { step: number; onStep: (value: number) => void }) {
  return (
    <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-5 lg:items-start">
      <aside className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 lg:col-span-2">
        <div><p className="flex items-center gap-2 text-xs font-semibold"><span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">1</span>What should we check?</p><div className="mt-3 flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900"><span className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-2 py-1.5 text-[11px] font-semibold shadow-sm dark:bg-zinc-800"><FileText className="size-3" />Saved resume</span><span className="flex-1 px-2 py-1.5 text-center text-[11px] text-zinc-500">Upload a file</span></div><div className="mt-2"><MiniSelect label="Resume" value="Angela - Virtual Assistant" /></div></div>
        <div><p className="flex items-center gap-2 text-xs font-semibold"><span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">2</span>Target job description</p><div className="mt-2 min-h-24 rounded-lg border border-zinc-200 px-3 py-2 text-[11px] leading-relaxed text-zinc-500 dark:border-zinc-700">We are looking for an executive virtual assistant with calendar management, CRM, client communication, and reporting experience...</div></div>
        <button type="button" onClick={() => onStep(1)} className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary text-xs font-semibold text-white">{step === 1 ? <Loader2 className="size-3.5 animate-spin" /> : <ScanSearch className="size-3.5" />}{step === 1 ? "Analyzing resume" : "Run ATS check"}</button>
      </aside>
      <div className="min-w-0 lg:col-span-3">
        <AnimatePresence mode="wait">
          {step === 0 ? <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex min-h-[25rem] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white/50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-950/40"><span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"><ScanSearch className="size-6" /></span><p className="mt-4 text-sm font-semibold">Your report will appear here</p><p className="mt-2 max-w-xs text-xs leading-relaxed text-zinc-500">Run the check for an overall score, keyword gaps, and specific rewrites.</p></motion.div> : null}
          {step === 1 ? <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3"><div className="flex items-center gap-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"><div className="size-24 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" /><div className="flex-1 space-y-3"><div className="h-3 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" /><div className="h-8 w-36 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" /><div className="h-14 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" /></div></div><div className="h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" /><div className="h-36 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" /></motion.div> : null}
          {step === 2 ? <motion.div key="report" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3"><div className="flex items-center gap-5 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"><div className="flex size-24 shrink-0 items-center justify-center rounded-full border-[7px] border-success-border"><div className="text-center"><strong className="block text-2xl tabular-nums">86</strong><span className="text-[10px] text-zinc-500">Strong</span></div></div><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Parser compatibility</p><span className="mt-2 inline-flex items-center gap-1 rounded-md border border-success-border bg-success-surface px-2 py-1 text-[11px] font-semibold text-success-surface-foreground"><Check className="size-3" />Excellent</span><div className="mt-3 rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-900"><p className="text-[10px] font-semibold text-zinc-500">Do this first</p><p className="mt-1 text-xs font-medium">Add reporting outcomes to your latest role.</p></div></div></div><div className="flex rounded-lg bg-zinc-200/60 p-1 dark:bg-zinc-800"><span className="flex-1 rounded-md bg-white px-2 py-1.5 text-center text-[11px] font-semibold shadow-sm dark:bg-zinc-950">Overview</span><span className="flex-1 px-2 py-1.5 text-center text-[11px] text-zinc-500">Keywords 8</span><span className="flex-1 px-2 py-1.5 text-center text-[11px] text-zinc-500">Fixes 3</span></div><div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"><p className="text-xs font-semibold">Section scores</p><div className="mt-3 space-y-2">{[["Experience", "84", "Add measurable outcomes"], ["Keywords", "88", "Strong role alignment"], ["Formatting", "91", "Clean ATS reading order"]].map(([label, score, note]) => <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800"><div><p className="text-[11px] font-semibold">{label}</p><p className="text-[10px] text-zinc-500">{note}</p></div><strong className="text-xs tabular-nums">{score}</strong></div>)}</div></div></motion.div> : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AssistantPreview({ step, onStep }: { step: number; onStep: (value: number) => void }) {
  return (
    <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-5 lg:items-start">
      <aside className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 lg:col-span-2"><MiniSelect label="Working on" value="Angela - Virtual Assistant" /><div><p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Target role</p><div className="mt-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs dark:border-zinc-700">Executive Virtual Assistant</div></div><div><p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Job description</p><div className="mt-1.5 min-h-24 rounded-lg border border-zinc-200 px-3 py-2 text-[11px] leading-relaxed text-zinc-500 dark:border-zinc-700">Manage schedules, client communication, CRM updates, and weekly reporting for a growing remote team.</div></div></aside>
      <div className="min-w-0 space-y-3 lg:col-span-3">
        <div className="flex rounded-lg bg-zinc-200/60 p-1 dark:bg-zinc-800"><span className="flex flex-1 items-center justify-center gap-1 rounded-md bg-white px-2 py-1.5 text-[11px] font-semibold shadow-sm dark:bg-zinc-950"><Sparkles className="size-3" />Resume Improver</span><span className="flex flex-1 items-center justify-center gap-1 px-2 py-1.5 text-[11px] text-zinc-500"><Target className="size-3" />Keywords</span><span className="hidden flex-1 items-center justify-center gap-1 px-2 py-1.5 text-[11px] text-zinc-500 sm:flex"><Trophy className="size-3" />Achievements</span></div>
        <p className="text-[11px] text-zinc-500">Rewrite your summary, experience, or the whole resume.</p>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"><p className="text-xs font-semibold">Goal</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{[["Rewrite summary", FileText], ["Improve experience", Briefcase], ["Full resume", Sparkles]].map(([label, Icon], index) => { const GoalIcon = Icon as typeof FileText; return <div key={label as string} className={cn("rounded-lg border p-3", index === 1 ? "border-primary bg-primary/5" : "border-zinc-200 dark:border-zinc-700")}><GoalIcon className={cn("size-3.5", index === 1 ? "text-primary" : "text-zinc-400")} /><span className="mt-2 block text-[11px] font-semibold">{label as string}</span></div>; })}</div><button type="button" onClick={() => onStep(1)} className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-white">{step === 1 ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}{step === 1 ? "Improving" : "Improve resume"}</button></div>
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
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const reduceMotion = useReducedMotion();
  const activeIndex = features.findIndex((feature) => feature.id === active);
  const activeFeature = features[activeIndex] ?? features[0];

  useEffect(() => {
    if (!playing || reduceMotion) return;
    const timer = window.setTimeout(() => {
      if (step < 2) setStep((current) => current + 1);
      else { setActive(features[(activeIndex + 1) % features.length].id); setStep(0); }
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [activeIndex, playing, reduceMotion, step]);

  function selectFeature(id: FeatureId) { setActive(id); setStep(0); }

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
          <div className="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950 sm:flex sm:items-center sm:justify-between sm:px-5"><div><h3 className="text-base font-semibold">{activeFeature.name}</h3><p className="mt-1 max-w-3xl text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-sm">{activeFeature.description}</p></div><div className="mt-3 flex items-center justify-between gap-4 sm:mt-0 sm:justify-end"><TourSteps step={step} /><Link href={activeFeature.href} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-primary hover:underline dark:text-zinc-200">{activeFeature.cta}<ArrowRight className="size-3.5" /></Link></div></div>
          <div className="relative min-h-[38rem] overflow-hidden bg-zinc-50 dark:bg-zinc-900 sm:min-h-[35rem]">
            <AnimatePresence mode="wait" initial={false}><motion.div key={active} initial={reduceMotion ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: -12 }} transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}>{active === "hunter" ? <JobHunterPreview step={step} onStep={setStep} /> : null}{active === "ats" ? <AtsPreview step={step} onStep={setStep} /> : null}{active === "assistant" ? <AssistantPreview step={step} onStep={setStep} /> : null}</motion.div></AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
