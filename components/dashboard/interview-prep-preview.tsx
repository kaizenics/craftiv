"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DemoCursor, TypingCaret, useCursorTarget } from "@/components/feature-demo-cursor";
import { AlertCircle, ArrowLeft, ArrowUpRight, Check, Eye, Loader2, Users } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

// Example content only. Each scene mirrors a real screen: the Applications list,
// the Interview prep dialog, and the saved Interview Prep page.
const ROWS = [
  { score: 88, title: "Senior .NET Software Developer", status: "New" },
  { score: 86, title: "Executive Assistant", status: "Saved" },
  { score: 81, title: "Customer Support Specialist", status: "New" },
];
const QUESTION = "Tell me about a time you juggled several priorities.";
const ANSWER =
  "At Northwind Studio I supported two directors with overlapping calendars. I set a shared priority list each Monday and kept weekly reports on time for a year.";
const TYPED = "I kept two directors on schedule by sharing one priority list every Monday.";
const TIP = "Add a number, like meetings coordinated per week.";

type Scene = "list" | "dialog" | "loading" | "page";

/** The storyboard: which screen is up, where the cursor goes, and whether it clicks. */
const BEATS: { scene: Scene; target: string | null; click?: boolean; typing?: boolean; revealed?: boolean; ms: number }[] = [
  { scene: "list", target: null, ms: 900 },
  { scene: "list", target: "row-prep", ms: 1100 },
  { scene: "list", target: "row-prep", click: true, ms: 650 },
  { scene: "dialog", target: "row-prep", ms: 500 },
  { scene: "dialog", target: "prepare", ms: 1100 },
  { scene: "dialog", target: "prepare", click: true, ms: 600 },
  { scene: "loading", target: "prepare", ms: 1500 },
  { scene: "page", target: "note", ms: 1200 },
  { scene: "page", target: "note", click: true, ms: 500 },
  { scene: "page", target: "note", typing: true, ms: 4600 },
  { scene: "page", target: "compare", ms: 1100 },
  { scene: "page", target: "compare", click: true, ms: 500 },
  { scene: "page", target: "compare", revealed: true, ms: 3600 },
];

export function InterviewPrepPreview() {
  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const [beatIndex, setBeatIndex] = useState(reduceMotion ? BEATS.length - 1 : 0);
  const [typed, setTyped] = useState(0);
  const beat = BEATS[beatIndex];

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setTimeout(() => {
      setBeatIndex((i) => (i + 1) % BEATS.length);
      setTyped(0);
    }, beat.ms);
    return () => clearTimeout(timer);
  }, [beat.ms, beatIndex, reduceMotion]);

  // Types the user's own answer during the last beat.
  useEffect(() => {
    if (!beat.typing || reduceMotion) return;
    const timer = setInterval(() => setTyped((n) => Math.min(TYPED.length, n + 1)), 55);
    return () => clearInterval(timer);
  }, [beat.typing, reduceMotion]);

  const point = useCursorTarget(stageRef, beat.target, beatIndex);
  const scene = beat.scene;
  const pastTyping = beatIndex > BEATS.findIndex((b) => b.typing);
  const shownTyped = reduceMotion || pastTyping ? TYPED : TYPED.slice(0, typed);
  const words = shownTyped.trim() ? shownTyped.trim().split(/\s+/).length : 0;
  const revealed = reduceMotion || !!beat.revealed;

  return (
    <div aria-hidden ref={stageRef} className="relative h-[27rem] overflow-hidden rounded-xl bg-muted/50 p-5">
      <AnimatePresence mode="wait" initial={false}>
        {scene === "page" ? (
          <motion.div key="page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <ArrowLeft className="size-3" /> Applications
            </p>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg border border-success-border bg-success-surface font-display text-sm font-semibold text-success-surface-foreground">
                88
              </span>
              <div>
                <p className="font-display text-base font-bold text-foreground">Interview prep</p>
                <p className="text-[11px] text-muted-foreground">Senior .NET Software Developer · New</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <span className="relative h-4 w-7 rounded-full bg-primary">
                <span className="absolute top-0.5 right-0.5 size-3 rounded-full bg-white" />
              </span>
              <span className="text-[11px] font-medium text-foreground">Practice mode</span>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-[10px] font-medium text-muted-foreground">1. Behavioural</p>
              <p className="mt-0.5 text-xs font-medium text-foreground">{QUESTION}</p>
              <div
                data-cursor-target="note"
                className={cn("mt-2.5 rounded-lg p-2.5 transition-colors", beat.typing ? "bg-muted/70" : "bg-muted/40")}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-medium text-foreground">Your answer</span>
                  {pastTyping || reduceMotion ? <span className="inline-flex items-center gap-0.5 text-[9.5px] text-success-surface-foreground"><Check className="size-2.5" />Saved</span> : null}
                </div>
                <p className={cn("mt-1 min-h-8 text-[10.5px] leading-relaxed", shownTyped ? "text-foreground" : "text-muted-foreground")}>
                  {shownTyped || (beat.typing ? "" : "How would you answer this? Write it the way you would say it out loud.")}
                  {beat.typing ? <TypingCaret /> : null}
                </p>
                <p className="text-right text-[9px] tabular-nums text-muted-foreground">{words} words</p>
              </div>
              <div className="mt-2.5 border-t border-border pt-2.5">
                {revealed ? (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-[10px] font-medium text-muted-foreground">Suggested answer, from your resume</p>
                    <p className="mt-1 text-[10.5px] leading-relaxed text-foreground">{ANSWER}</p>
                    <p className="mt-1.5 rounded-md border border-primary/15 bg-primary/5 p-1.5 text-[9.5px] text-foreground">
                      <span className="font-semibold text-primary">Tip: </span>
                      {TIP}
                    </p>
                  </motion.div>
                ) : (
                  <div
                    data-cursor-target="compare"
                    className={cn(
                      "flex items-center justify-between rounded-lg border border-dashed px-2.5 py-2 transition-colors",
                      beat.target === "compare" ? "border-primary bg-primary/5" : "border-border",
                    )}
                  >
                    <span>
                      <span className="block text-[10.5px] font-medium text-foreground">Compare with a suggested answer</span>
                      <span className="block text-[9.5px] text-muted-foreground">Try yours first, then reveal it.</span>
                    </span>
                    <Eye className="size-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="applications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            <p className="font-display text-base font-bold text-foreground">Applications</p>
            <div className="flex gap-1 pb-1">
              <span className="rounded-md bg-card px-2 py-1 text-[10px] font-medium text-foreground shadow-sm">To apply (3)</span>
              <span className="px-2 py-1 text-[10px] text-muted-foreground">Applied (0)</span>
              <span className="px-2 py-1 text-[10px] text-muted-foreground">Interviewing (0)</span>
            </div>
            {ROWS.map((row, i) => (
              <div key={row.title} className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-success-border bg-success-surface font-display text-sm font-semibold text-success-surface-foreground">
                  {row.score}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-foreground">{row.title}</span>
                  <span className="block text-[10px] text-muted-foreground">{row.status}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-medium text-primary-foreground">
                  Apply <ArrowUpRight className="size-2.5" />
                </span>
                <span
                  data-cursor-target={i === 0 ? "row-prep" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors",
                    i === 0 && beat.target === "row-prep" && scene === "list" ? "border-primary bg-primary/5 text-primary" : "border-border bg-muted/40 text-foreground",
                  )}
                >
                  <Users className="size-2.5" /> Interview prep
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The real dialog, over a dimmed page, exactly as clicking the button opens it. */}
      <AnimatePresence>
        {scene === "dialog" || scene === "loading" ? (
          <motion.div key="dialog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-black/40 p-6">
            <motion.div initial={{ scale: 0.96, y: 6 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm rounded-xl bg-card p-4 shadow-xl">
              <p className="font-display text-sm font-semibold text-foreground">Interview prep</p>
              <p className="mt-0.5 text-[10.5px] text-muted-foreground">The questions Senior .NET Software Developer is likely to ask.</p>
              <p className="mt-3 flex gap-1.5 rounded-lg border border-border bg-muted/40 p-2 text-[9.5px] text-muted-foreground">
                <AlertCircle className="mt-px size-3 shrink-0" />
                Answers only use what your resume says. Your prep is saved to this job.
              </p>
              <span
                data-cursor-target="prepare"
                className={cn(
                  "mt-3 flex items-center justify-center gap-1.5 rounded-full bg-primary py-1.5 text-[11px] font-semibold text-primary-foreground",
                  scene === "loading" && "opacity-80",
                )}
              >
                {scene === "loading" ? <Loader2 className="size-3 animate-spin" /> : <Users className="size-3" />}
                {scene === "loading" ? "Preparing questions..." : "Prepare — 0.5 credits"}
              </span>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!reduceMotion ? <DemoCursor point={point} clicking={!!beat.click} clickKey={beatIndex} /> : null}
      <span className="absolute right-3 bottom-3 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Example</span>
    </div>
  );
}
