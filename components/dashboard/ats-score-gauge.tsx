"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { bandStyle } from "@/lib/ats-display";
import { cn } from "@/lib/utils";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const DURATION_MS = 720;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(listener: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  );
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

type AtsScoreGaugeProps = {
  score: number;
  className?: string;
};

export function AtsScoreGauge({ score, className }: AtsScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;

    let start: number | null = null;
    let frame = 0;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const elapsed = Math.min((timestamp - start) / DURATION_MS, 1);
      setProgress(easeOutCubic(elapsed));
      if (elapsed < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion, clamped]);

  // Reduced motion skips straight to the final value; no animation state is read.
  const displayed = reducedMotion ? clamped : Math.round(progress * clamped);
  const style = bandStyle(clamped);

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative h-36 w-36">
        <svg
          viewBox="0 0 120 120"
          className="h-full w-full -rotate-90"
          role="img"
          aria-label={`ATS score ${clamped} out of 100. ${style.label}.`}
        >
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="10"
            className="stroke-muted"
          />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - displayed / 100)}
            className={cn({
              "stroke-destructive": style.band === "critical",
              "stroke-warning": style.band === "attention",
              "stroke-success": style.band === "strong",
            })}
          />
        </svg>
        {/* The number is real text rather than SVG, so it stays selectable and
            scales with the reader's font-size preference. */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          aria-hidden="true"
        >
          <span className="font-display text-4xl font-bold tabular-nums text-foreground">
            {displayed}
          </span>
          <span className="text-xs text-muted-foreground">out of 100</span>
        </div>
      </div>

      <div className="text-center">
        <p className={cn("text-sm font-semibold", style.text)}>{style.label}</p>
        <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-muted-foreground">
          {style.hint}
        </p>
      </div>
    </div>
  );
}
