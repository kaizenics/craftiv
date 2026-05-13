"use client";

import { motion } from "motion/react";
import Link from "next/link";
import CardSwap, { Card } from "@/components/ui/card-swap";
import { TemplateLivePreview } from "@/components/resume/template-live-preview";

const showcaseTemplates = [
   { id: "harvard", name: "Harvard", color: "#1e1e1e" },
  { id: "orbit", name: "Orbit", color: "#f3f3f3" },
  { id: "boardroom", name: "Boardroom", color: "#fbfbfa" },
];

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-start justify-center overflow-hidden bg-white pt-24 md:min-h-[80vh] md:items-center md:pt-10 dark:bg-zinc-950">
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-8 lg:items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center lg:items-start lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary/20 text-xs">
                ✦
              </span>
              <span>1 free credit on sign-up · No subscriptions</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl md:text-5xl lg:text-6xl"
            >
              Professional resumes.{" "}
              <span className="block text-primary dark:text-white lg:inline">
                Built to get interviews.
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mx-auto mt-4 max-w-xl text-base leading-tight text-zinc-600 sm:mt-6 sm:text-md dark:text-zinc-400 lg:mx-0"
            >
              Create standout, ATS-friendly resumes in minutes with tools
              designed to highlight your strengths and help you land more
              interview calls.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex flex-col flex-wrap items-center gap-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <Link href="/resume/templates">
                <button className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 sm:px-8 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-primary/90 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100">
                  Create New Resume
                </button>
              </Link>
              <Link href="/resume/upload">
                <button className="inline-flex items-center justify-center rounded-xl border-2 border-zinc-200 bg-white px-6 py-3 sm:px-8 sm:py-3 text-sm sm:text-base font-semibold text-zinc-900 transition-all duration-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-transparent dark:text-zinc-100 dark:hover:bg-zinc-900">
                  Upload My Resume
                </button>
              </Link>
            </motion.div>

          </motion.div>

          {/* Mobile Card Swap */}
          <div className="relative mt-2 flex h-[360px] justify-center lg:hidden">
            <div className="relative h-[600px] w-[190px]">
              <CardSwap
                width={290}
                height={420}
                cardDistance={44}
                verticalDistance={58}
                delay={4500}
                pauseOnHover={false}
                useDefaultResponsiveTransform={false}
                containerClassName="left-1/2 top-1/2 bottom-auto right-auto -translate-x-1/2 -translate-y-1/2 origin-center"
              >
                {showcaseTemplates.map((template) => (
                  <Card
                    key={`mobile-${template.id}`}
                    customClass="overflow-hidden border-zinc-200 bg-white shadow-xl"
                  >
                    <div className="absolute inset-0 bg-white">
                      <TemplateLivePreview
                        templateId={template.id}
                        color={template.color}
                        showPhoto
                      />
                    </div>
                  </Card>
                ))}
              </CardSwap>
            </div>
          </div>

          <div className="absolute -bottom-45 -right-0 hidden lg:block">
            <CardSwap
              width={560}
              height={790}
              cardDistance={95}
              verticalDistance={120}
              delay={5000}
              pauseOnHover={false}
            >
              {showcaseTemplates.map((template) => (
                <Card
                  key={template.id}
                  customClass="overflow-hidden border-zinc-200 bg-white shadow-2xl"
                >
                  <div className="absolute inset-0 bg-white">
                    <TemplateLivePreview
                      templateId={template.id}
                      color={template.color}
                      showPhoto
                    />
                  </div>
                </Card>
              ))}
            </CardSwap>
          </div>
        </div>
      </div>
    </section>
  );
}
