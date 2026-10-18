"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { format } from "date-fns";

export type TickerJob = { id: string; title: string; company: string; url: string; postedAt: string | null };

const ROTATE_MS = 3500;

export function HeroJobTicker({ jobs }: { jobs: TickerJob[] }) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduceMotion || paused || jobs.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % jobs.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [reduceMotion, paused, jobs.length]);

  const job = jobs[index];

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <p className="flex items-center justify-between gap-4 text-xs text-zinc-500">
        <span>Recently posted remote roles</span>
        <a
          href="https://remotive.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:text-zinc-800 hover:underline"
        >
          Job data by Remotive
        </a>
      </p>
      <div className="relative mt-3 h-24 overflow-hidden" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.a
            key={job.id}
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="group absolute inset-0 block"
          >
            <span className="line-clamp-2 font-display text-xl leading-snug font-semibold text-zinc-900 group-hover:underline group-hover:underline-offset-4 sm:text-2xl">
              {job.title}
            </span>
            <span className="mt-1 block truncate text-sm text-zinc-500">
              {job.company}
              {job.postedAt ? ` · ${format(new Date(job.postedAt), "d MMM")}` : null}
            </span>
          </motion.a>
        </AnimatePresence>
      </div>
    </div>
  );
}
