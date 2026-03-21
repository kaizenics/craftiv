"use client";

import { motion } from "motion/react";
import Link from "next/link";
import DisplayCards from "@/components/ui/display-cards";

export function Hero() {
  return (
    <section className="relative flex min-h-250 md:min-h-screen items-center justify-center overflow-hidden bg-white dark:bg-zinc-950">
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
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
              <span className="text-zinc-900 dark:text-white">
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
                <button className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100">
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

          <div className="relative flex items-center justify-center mb-0 md:mb-20">
            <DisplayCards />
          </div>
        </div>
      </div>
    </section>
  );
}
