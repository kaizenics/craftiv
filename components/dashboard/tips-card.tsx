"use client";

import { Lightbulb, X, ArrowRight } from "@/components/ui/icons";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tips = [
  {
    title: "Start with action verbs",
    body: "Use words like 'developed', 'managed', or 'created' to open your bullet points — they signal impact immediately.",
  },
  {
    title: "Quantify your impact",
    body: "Numbers catch the eye. Replace vague claims with specifics: '40% revenue increase', 'managed a team of 12'.",
  },
  {
    title: "Match the job description",
    body: "Mirror keywords from the posting in your resume. It helps you pass ATS filters and shows you're a strong fit.",
  },
  {
    title: "Keep it concise",
    body: "One page for early-career, two pages max for senior roles. Recruiters spend ~7 seconds on a first scan.",
  },
  {
    title: "Use an ATS-friendly format",
    body: "Stick to clean layouts, standard section headings, and avoid tables or images that confuse automated screening.",
  },
];

export function TipsCard() {
  const [currentTip, setCurrentTip] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const nextTip = () => {
    setCurrentTip((prev) => (prev + 1) % tips.length);
  };

  const tip = tips[currentTip];

  return (
    <AnimatePresence initial={false}>
      {!dismissed && (
        <motion.div
          key="tips-card"
          exit={{ opacity: 0, scale: 0.97, height: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30"
        >
          {/* Dismiss */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setDismissed(true)}
            className="absolute right-3 top-3 h-7 w-7 text-amber-400 hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-900/40 dark:hover:text-amber-300"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex items-start gap-4 p-5 sm:p-6">
            {/* Icon */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
              <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pr-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600/70 dark:text-amber-400/70">
                Tip {currentTip + 1} of {tips.length}
              </p>
              <p className="mt-1 text-[15px] font-semibold leading-snug text-amber-950 dark:text-amber-100">
                {tip.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-amber-800/80 dark:text-amber-200/70">
                {tip.body}
              </p>

              {/* Progress dots + next */}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex gap-1.5">
                  {tips.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentTip(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        i === currentTip
                          ? "w-5 bg-amber-500 dark:bg-amber-400"
                          : "w-1.5 bg-amber-300/60 hover:bg-amber-400/80 dark:bg-amber-700 dark:hover:bg-amber-600",
                      )}
                    />
                  ))}
                </div>
                <button
                  onClick={nextTip}
                  className="ml-1 flex items-center gap-1 text-xs font-medium text-amber-700 transition-colors hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200"
                >
                  Next tip
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
