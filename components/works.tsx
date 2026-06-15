"use client";

import { useState } from "react";
import { MoveHorizontal } from "lucide-react";
import { motion } from "motion/react";
import { TemplateLivePreview } from "@/components/resume/template-live-preview";

const beforeExperience = [
  "Responsible for email, scheduling and tasks.",
  "Did CRM work and customer replies when needed.",
  "Helped manager and team with different duties.",
];

const beforeSkills = ["Microsoft Office", "Communication", "Hardworking", "Team player"];

function NonAtsResume() {
  return (
    <div className="flex h-full w-full items-start justify-center overflow-hidden bg-white">
      <div className="hidden h-full aspect-[210/297] max-w-full overflow-hidden border border-zinc-300 bg-[#f5f1ea] shadow-[0_28px_60px_-34px_rgba(63,63,70,0.5)] sm:block">
        <div className="flex h-full flex-col gap-5 p-6 font-serif text-zinc-800 sm:p-8 lg:p-10">
          <header className="border-b border-zinc-400 pb-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Non-ATS Resume
                </p>
                <h4 className="mt-2 text-2xl font-semibold uppercase tracking-[0.08em]">
                  Angela Martinez
                </h4>
                <p className="mt-1 text-sm italic text-zinc-600">
                  Virtual Assistant | Remote Operations Support
                </p>
              </div>

              <div className="border border-zinc-400 px-4 py-3 text-right text-sm leading-relaxed text-zinc-700">
                <p>angela@email.com</p>
                <p>+63 917 555 0184</p>
                <p>Manila, PH</p>
              </div>
            </div>
          </header>

          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Summary
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Looking for a job where I can use my skills and help a company with admin work,
              communication, and other tasks as assigned.
            </p>
          </section>

          <section>
            <div className="flex items-end justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Experience
              </p>
              <p className="text-xs italic text-zinc-500">
                Executive Assistant | 2022 - Present
              </p>
            </div>

            <div className="mt-3 space-y-3">
              {beforeExperience.map((item) => (
                <div key={item} className="flex gap-3 text-[15px] leading-relaxed text-zinc-700">
                  <span className="mt-2 h-2 w-2 shrink-0 bg-zinc-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 border-t border-zinc-400 pt-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Core Skills
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {beforeSkills.map((skill) => (
                  <span
                    key={skill}
                    className="border border-zinc-400 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Education
              </p>
              <div className="mt-3 border border-zinc-400 p-4">
                <p className="text-sm font-semibold">Bachelor of Business Administration</p>
                <p className="mt-1 text-sm text-zinc-600">University of Manila</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="flex h-full aspect-[210/297] max-w-full flex-col overflow-hidden border border-zinc-300 bg-[#f5f1ea] px-4 py-5 font-serif text-zinc-800 shadow-[0_28px_60px_-34px_rgba(63,63,70,0.5)] sm:hidden">
        <div className="border-b border-zinc-400 pb-3 text-center">
          <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Non-ATS Resume
          </p>
          <h4 className="mt-2 text-[17px] font-semibold uppercase tracking-[0.08em]">
            Angela Martinez
          </h4>
          <p className="mt-1 text-[9px] italic text-zinc-600">
            Virtual Assistant | Remote Operations Support
          </p>
        </div>

        <div className="mt-3 border-b border-zinc-400 pb-3 text-center text-[8px] leading-relaxed text-zinc-700">
          <p>angela@email.com</p>
          <p>+63 917 555 0184</p>
          <p>Manila, PH</p>
        </div>

        <div className="mt-3">
          <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Summary
          </p>
          <p className="mt-1.5 text-[8px] leading-relaxed text-zinc-700">
            Looking for a job where I can use my skills and help a company with admin work,
            communication, and other tasks as assigned.
          </p>
        </div>

        <div className="mt-3">
          <div className="flex items-end justify-between gap-2">
            <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Experience
            </p>
            <p className="text-[7px] italic text-zinc-500">2022 - Present</p>
          </div>
          <div className="mt-1.5 space-y-1.5">
            {beforeExperience.map((item) => (
              <div key={item} className="flex gap-1.5 text-[8px] leading-relaxed text-zinc-700">
                <span className="mt-1.5 h-1 w-1 shrink-0 bg-zinc-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-zinc-400 pt-3">
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Core Skills
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {beforeSkills.map((skill) => (
                <span key={skill} className="border border-zinc-400 bg-zinc-100 px-1.5 py-0.5 text-[7px] text-zinc-700">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Education
            </p>
            <div className="mt-1.5 border border-zinc-400 p-1.5">
              <p className="text-[7px] font-semibold">BBA</p>
              <p className="mt-0.5 text-[7px] text-zinc-600">University of Manila</p>
            </div>
          </div>
        </div>
      </div>
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
