"use client";

import Image from "next/image";
import { useState } from "react";
import { MoveHorizontal } from "lucide-react";
import { motion } from "motion/react";
import { TemplateLivePreview } from "@/components/resume/template-live-preview";

/**
 * A real-world "before" resume: a photo banner and a two-column layout that looks
 * polished but reads poorly for applicant tracking systems. The image is A4 in
 * proportion, matching the comparison frame, so it fills it without distortion.
 */
function NonAtsResume() {
  return (
    <div className="relative h-full w-full bg-white">
      <Image
        src="/non-ats.png"
        alt="Example of a non-ATS-friendly resume: a two-column design with a photo banner, sidebar sections and decorative headings"
        fill
        sizes="(max-width: 768px) 100vw, 672px"
        className="object-cover object-top"
      />
    </div>
  );
}

export function Works() {
  const [divider, setDivider] = useState(50);

  return (
    <section className="relative py-20 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              See the difference AI optimization makes
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">
              Drag the slider to compare a weak resume against Craftiv&apos;s Harvard template preview,
              built for cleaner recruiter scanning and ATS readability.
            </p>
          </div>

          <div className="mt-10 mx-auto max-w-2xl">
            <div className="relative mx-auto aspect-[210/297] w-full overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 p-3 shadow-[0_30px_70px_-42px_rgba(15,23,42,0.5)] sm:p-4">
              <div className="absolute inset-3 overflow-hidden sm:inset-4">
                <div
                  className="pointer-events-none absolute inset-0 z-30"
                  style={{ clipPath: `inset(0 ${100 - divider}% 0 0)` }}
                >
                  <div className="absolute left-3 top-3 rounded-full bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-white sm:left-4 sm:top-4 sm:text-xs">
                    Non-ATS Resume
                  </div>
                </div>

                <div
                  className="pointer-events-none absolute inset-0 z-30"
                  style={{ clipPath: `inset(0 0 0 ${divider}%)` }}
                >
                  <div className="absolute right-3 top-3 rounded-full bg-sky-100 px-3 py-1.5 text-[11px] font-semibold text-sky-900 sm:right-4 sm:top-4 sm:text-xs">
                    Craftiv AI ATS-Optimized Resume
                  </div>
                </div>

                <div className="absolute inset-0 overflow-hidden">
                  <NonAtsResume />
                </div>

                <div
                  className="absolute inset-0 overflow-hidden bg-white"
                  style={{ clipPath: `inset(0 0 0 ${divider}%)` }}
                >
                  <TemplateLivePreview templateId="harvard" color="#1e1e1e" />
                </div>

                <div
                  className="pointer-events-none absolute inset-y-0 z-20 w-px bg-white/95 shadow-[0_0_0_1px_rgba(15,23,42,0.08)]"
                  style={{ left: `calc(${divider}% - 0.5px)` }}
                />

                <div
                  className="pointer-events-none absolute top-1/2 z-30 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow-[0_18px_40px_-18px_rgba(15,23,42,0.65)]"
                  style={{ left: `${divider}%` }}
                >
                  <MoveHorizontal className="h-6 w-6" />
                </div>

                <input
                  aria-label="Compare resume quality"
                  className="absolute inset-0 z-40 h-full w-full cursor-ew-resize appearance-none touch-pan-y opacity-0"
                  min={0}
                  max={100}
                  onChange={(event) => setDivider(Number(event.target.value))}
                  type="range"
                  value={divider}
                />
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
