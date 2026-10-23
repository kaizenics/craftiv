"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

// WebGL and ~1,400 lines that only matter far below the fold: load after the first screen. The box has a fixed height, so no layout shift.
const FlexCarousel = dynamic(() => import("@/components/ui/flex-carousel"), { ssr: false });
import { templates } from "@/lib/data/templates";
import { coverLetterTemplates } from "@/lib/cover-letter-templates";
import { BlurInText } from "@/components/ui/blur-in-text";
import { BlurFade } from "@/components/ui/blur-fade";

const templateSlides = templates.map((template) => ({
  src: `/resume-templates/${template.id}.webp`,
  alt: `${template.name} resume template`,
  title: template.name,
}));


const facts = [
  {
    title: `${templates.length} resume templates`,
    description: `Plus ${coverLetterTemplates.length} cover letter templates that match them.`,
  },
  {
    title: "Start from your old resume",
    description: "Upload a PDF or Word file and the sections fill in for you.",
  },
  {
    title: "Free downloads",
    description: "PDF and Word exports never use credits, on any plan.",
  },
  {
    title: "Share a link",
    description: "Send a link instead of an attachment and see when it was opened.",
  },
];

export function Documents() {
  return (
    <section className="bg-white py-20 font-sans lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-4xl">
              <BlurInText text="Resumes and cover letters for every application" />
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-600">
              <BlurInText text="Keep one resume per kind of role and let Craftiv tell you which one fits each job." delay={0.4} stagger={0.01} />
            </p>
          </div>
          <Link
            href="/resume/templates"
            className="shrink-0 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Browse templates
          </Link>
        </div>

        <dl className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact, index) => (
            <BlurFade key={fact.title} delay={index * 0.1}>
              <dt className="font-semibold text-zinc-900">{fact.title}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-zinc-600">{fact.description}</dd>
            </BlurFade>
          ))}
        </dl>

      </div>

      {/* Previews are captures of the live templates (public/resume-templates); the carousel renders them in WebGL, full-bleed so bent cards run off the screen edges. */}
        <BlurFade className="mt-10 h-[460px] w-full text-zinc-900 sm:h-[640px]" delay={0.2}>
          <FlexCarousel
            items={templateSlides}
            fit="natural"
            cardHeight={0.62}
            radius={10}
            captureWheel={false}
            autoplay
            interval={3}
          />
        </BlurFade>
    </section>
  );
}
