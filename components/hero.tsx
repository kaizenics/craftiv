"use client";

import { motion } from "motion/react";
import Link from "next/link";
import CardSwap, { Card } from "@/components/ui/card-swap";
import { TemplateLivePreview } from "@/components/resume/template-live-preview";

const showcaseTemplates = [
   { id: "harvard", name: "Harvard", color: "#1e1e1e" },
  { id: "celestial", name: "Celestial", color: "#1e3a5f" },
  { id: "metro", name: "Metro", color: "#0d9488" },
];

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-start justify-center overflow-hidden bg-white pt-24 md:min-h-screen md:items-center md:pt-0 dark:bg-zinc-950">
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-8 lg:items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-zinc-900 dark:text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl "
            >
              Professional resumes.{" "}
              <span className="text-primary dark:text-white">
                Built to get interviews.
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-4 sm:mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-zinc-600 dark:text-zinc-400"
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
              className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4"
            >
              <Link href="/resume/templates">
                <button className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-primary/90 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100">
                  Create New Resume
                </button>
              </Link>
              <Link href="/resume/upload">
                <button className="inline-flex items-center justify-center rounded-xl border-2 border-zinc-200 bg-white px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold text-zinc-900 transition-all duration-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-transparent dark:text-zinc-100 dark:hover:bg-zinc-900">
                  Upload My Resume
                </button>
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div className="mt-8 sm:mt-12 flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  ATS-Optimized
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Easy to Customize
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Export Instantly
                </span>
              </div>
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

          <div className="absolute -bottom-20 -right-0 hidden lg:block">
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
