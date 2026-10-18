"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { BlurFade } from "@/components/ui/blur-fade";
import { BlurInText } from "@/components/ui/blur-in-text";

// Screens are real captures of the dashboard's built-in sample data (see public/how-it-works).
const steps = [
  {
    title: "Find",
    description:
      "Save a search once. Craftiv checks Remotive daily or weekly, and you can clip a post from any job board in one click.",
    image: { src: "/how-it-works/find.png", width: 1328, height: 1204, alt: "Scheduled hunt settings: daily search for virtual assistant roles with an email digest" },
  },
  {
    title: "Match",
    description:
      "Every job is scored against your resume, with what already works and what is missing. Scoring runs on rules, so it is free.",
    image: { src: "/how-it-works/match.png", width: 1326, height: 1252, alt: "A job scored 86, strong match, with keyword, experience and formatting breakdown" },
  },
  {
    title: "Tailor",
    description:
      "Rewrite your experience for the role in one click. Employers and dates stay as they are, and no higher score means no charge.",
    image: { src: "/how-it-works/tailor.png", width: 1326, height: 400, alt: "Before and after rewrite of an executive assistant experience entry" },
  },
  {
    title: "Track",
    description: "Move each application from new to offer on one board, and get an email digest when something changes.",
    image: { src: "/how-it-works/track-board.png", width: 1856, height: 880, alt: "Application board with new, saved, applied and interviewing columns" },
  },
];

function Screen({ step, priority }: { step: (typeof steps)[number]; priority?: boolean }) {
  return (
    <Image
      src={step.image.src}
      width={step.image.width}
      height={step.image.height}
      alt={step.image.alt}
      priority={priority}
      sizes="(min-width: 1024px) 56vw, 100vw"
      className="h-auto max-h-full w-full rounded-xl object-contain shadow-[0_24px_48px_-24px_rgb(24_24_27/0.25)]"
    />
  );
}

export function HowItWorks() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  // The step crossing the middle of the viewport owns the screen.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-zinc-200 bg-zinc-50 py-24 font-sans lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="max-w-2xl font-display text-4xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-5xl">
          <BlurInText text="From job post to offer, in one place" />
        </h2>

        <div className="mt-16 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <ol className="lg:col-span-5">
            {steps.map((step, index) => (
              <li
                key={step.title}
                ref={(el) => {
                  stepRefs.current[index] = el;
                }}
                data-index={index}
                className="py-10 first:pt-0 lg:flex lg:min-h-[70vh] lg:flex-col lg:justify-center lg:py-0"
              >
                <BlurFade>
                <h3
                  className={cn(
                    "font-display text-4xl font-semibold tracking-tight transition-colors duration-500 sm:text-5xl",
                    index === active ? "text-zinc-900" : "text-zinc-900 lg:text-zinc-300",
                  )}
                >
                  {step.title}
                </h3>
                <p
                  className={cn(
                    "mt-4 max-w-md text-base leading-relaxed transition-colors duration-500 sm:text-lg",
                    index === active ? "text-zinc-600" : "text-zinc-600 lg:text-zinc-400",
                  )}
                >
                  {step.description}
                </p>
                {/* Phones have no sticky panel, so each step carries its own screen. */}
                <div className="mt-8 rounded-2xl bg-zinc-100 p-4 sm:p-6 lg:hidden">
                  <Screen step={step} />
                </div>
                </BlurFade>
              </li>
            ))}
          </ol>

          <div className="hidden lg:col-span-7 lg:block">
            <BlurFade delay={0.1} className="sticky top-24 flex h-[calc(100dvh-8rem)] items-center justify-center rounded-3xl bg-zinc-100 p-10">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="flex max-h-full w-full items-center justify-center"
                >
                  <Screen step={steps[active]} priority={active === 0} />
                </motion.div>
              </AnimatePresence>
            </BlurFade>
          </div>
        </div>
      </div>
    </section>
  );
}
