"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DemoCursor, useCursorTarget } from "@/components/feature-demo-cursor";
import { ChevronDown, Loader2, Users } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

// Example content only, so people see what they get before spending credits.
const QUESTIONS = [
  {
    type: "Behavioural",
    question: "Tell me about a time you juggled several priorities.",
    answer:
      "At Northwind Studio I supported two directors with overlapping calendars. I set a shared priority list each Monday and kept weekly reports on time for a year.",
    tip: "Add a number, like meetings coordinated per week.",
  },
  { type: "Role", question: "Which CRM tools have you used?" },
  { type: "Motivation", question: "Why do you want this role?" },
];

type Scene = "card" | "dialog" | "loading" | "questions";

/**
 * A scripted walkthrough with a cursor: open Interview prep on a job, prepare,
 * wait, then open the first question. Each beat names what is on screen, where
 * the cursor goes, and whether it clicks, so the whole demo reads as a storyboard.
 */
const BEATS: { scene: Scene; target: string | null; click?: boolean; expanded?: boolean; ms: number }[] = [
  { scene: "card", target: null, ms: 900 },
  { scene: "card", target: "prep-button", ms: 1100 },
  { scene: "card", target: "prep-button", click: true, ms: 700 },
  { scene: "dialog", target: "prep-button", ms: 500 },
  { scene: "dialog", target: "prepare", ms: 1100 },
  { scene: "dialog", target: "prepare", click: true, ms: 600 },
  { scene: "loading", target: "prepare", ms: 1600 },
  { scene: "questions", target: "q-0", ms: 1100 },
  { scene: "questions", target: "q-0", click: true, ms: 500 },
  { scene: "questions", target: "q-0", expanded: true, ms: 3800 },
];

export function InterviewPrepPreview() {
  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const [beatIndex, setBeatIndex] = useState(reduceMotion ? BEATS.length - 1 : 0);
  const beat = BEATS[beatIndex];

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setTimeout(() => setBeatIndex((i) => (i + 1) % BEATS.length), beat.ms);
    return () => clearTimeout(timer);
  }, [beat.ms, beatIndex, reduceMotion]);

  const point = useCursorTarget(stageRef, beat.target, beatIndex);
  const scene = beat.scene;

  return (
    <div aria-hidden ref={stageRef} className="relative h-96 overflow-hidden rounded-xl bg-muted/50 p-6">
      <AnimatePresence mode="wait" initial={false}>
        {scene === "card" ? (
          <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Executive Assistant</p>
                <p className="text-xs text-muted-foreground">Northstar Commerce · Remote</p>
              </div>
              <span className="rounded-lg border border-success-border bg-success-surface px-2 py-1 font-display text-base font-semibold text-success-surface-foreground">
                86
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Tailor</span>
              <span className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground">Apply</span>
              <span
                data-cursor-target="prep-button"
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  beat.target === "prep-button" ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground",
                )}
              >
                <Users className="size-3" />
                Interview prep
              </span>
            </div>
          </motion.div>
        ) : scene === "questions" ? (
          <motion.div key="questions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground">Interview prep</p>
            <div className="mt-2 border-t border-border">
              {QUESTIONS.map((q, i) => (
                <div key={q.question} className="border-b border-border py-2.5">
                  <div data-cursor-target={`q-${i}`} className="flex items-start justify-between gap-2">
                    <span>
                      <span className="block text-[10px] font-medium text-muted-foreground">{q.type}</span>
                      <span className="block text-xs font-medium text-foreground">{q.question}</span>
                    </span>
                    <ChevronDown className={cn("mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform", i === 0 && beat.expanded && "rotate-180")} />
                  </div>
                  <AnimatePresence>
                    {i === 0 && beat.expanded && q.answer ? (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <p className="pt-2 text-[11px] leading-relaxed text-foreground">{q.answer}</p>
                        <p className="mt-2 rounded-md bg-muted/60 p-2 text-[10px] text-muted-foreground">
                          <span className="font-semibold text-foreground">Tip: </span>
                          {q.tip}
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="dialog" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground">Interview prep</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Questions for Executive Assistant, answered from your resume.</p>
            <span
              data-cursor-target="prepare"
              className={cn(
                "mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground transition-opacity",
                scene === "loading" && "opacity-80",
              )}
            >
              {scene === "loading" ? <Loader2 className="size-3.5 animate-spin" /> : <Users className="size-3.5" />}
              {scene === "loading" ? "Preparing questions..." : "Prepare — 0.5 credits"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {!reduceMotion ? <DemoCursor point={point} clicking={!!beat.click} clickKey={beatIndex} /> : null}
      <span className="absolute right-3 bottom-3 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Example</span>
    </div>
  );
}
