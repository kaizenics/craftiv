"use client";

import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { templates } from "@/lib/data/templates";
import { coverLetterTemplates } from "@/lib/cover-letter-templates";
import { TemplateLivePreview } from "@/components/resume/template-live-preview";
import { BlurInText } from "@/components/ui/blur-in-text";
import { BlurFade } from "@/components/ui/blur-fade";

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

        <BlurFade className="mt-14" delay={0.2}>
        <Carousel opts={{ align: "start", loop: true }} className="w-full">
          <CarouselContent className="-ml-4">
            {templates.slice(0, 8).map((template) => (
              <CarouselItem key={template.id} className="basis-1/2 pl-4 sm:basis-1/3 lg:basis-1/4">
                <div className="relative aspect-3/4 overflow-hidden rounded-xl border border-zinc-200 bg-white">
                  <div className="absolute inset-0">
                    <TemplateLivePreview templateId={template.id} color={template.primaryColor} showPhoto />
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-zinc-900">{template.name}</p>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-8 flex gap-2">
            <CarouselPrevious className="static translate-y-0 border-zinc-200 bg-white hover:bg-zinc-50" />
            <CarouselNext className="static translate-y-0 border-zinc-200 bg-white hover:bg-zinc-50" />
          </div>
        </Carousel>
        </BlurFade>
      </div>
    </section>
  );
}
