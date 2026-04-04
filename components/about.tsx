"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { templates } from "@/lib/data/templates";
import { TemplateLivePreview } from "@/components/resume/template-live-preview";
import { cn } from "@/lib/utils";

const features = [
  {
    iconSrc: "/icons/list.png",
    eyebrow: "Speed",
    title: "Pick a Template",
    description: "Start with a clean, ATS-friendly design that fits your role and personal style.",
  },
  {
    iconSrc: "/icons/pen.png",
    eyebrow: "Reliability",
    title: "Add Content with AI",
    description: "Describe your role once and let AI generate polished bullet points in seconds.",
  },
  {
    iconSrc: "/icons/download.png",
    eyebrow: "Precision",
    title: "Download and Send",
    description: "Export your resume instantly as a ready-to-share file and apply with confidence.",
  },
  {
    iconSrc: "/icons/committee.png",
    eyebrow: "Proof",
    title: "Get Hired",
    description: "Stand out from the crowd with a professional resume built to win interviews.",
  },
];

function ResumeTemplateCard({ template }: { template: typeof templates[0] }) {
  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-3/4 rounded-xl border border-zinc-200 shadow-lg overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:scale-[1.02] bg-white">
        {/* Resume Template Preview */}
        <div className="absolute inset-0">
          <TemplateLivePreview
            templateId={template.id}
            color={template.primaryColor}
          />
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-zinc-900/0 group-hover:bg-zinc-900/10 transition-colors duration-300" />
      </div>
      
      {/* Template Info */}
      <div className="mt-4 text-center">
        <h4 className="font-semibold text-zinc-900">{template.name}</h4>
        <p className="text-sm text-zinc-500">{template.description}</p>
      </div>
    </div>
  );
}

export function About() {
  return (
    <section id="about" className="relative bg-primary/5 py-20 lg:py-32 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
            Why choose <span className="text-primary">Craftiv</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-zinc-600">
            We make resume building simple, fast, and effective. No fluff, just results.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_10px_24px_-16px_rgba(9,9,11,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-[0_20px_35px_-18px_rgba(9,9,11,0.38)]"
            >
              <div
                className={cn(
                  "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-70",
                  "bg-primary/10"
                )}
              />

              <div className="relative flex items-start justify-between gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center  text-primary transition-transform duration-300 group-hover:scale-105"
                >
                  <Image
                    src={feature.iconSrc}
                    alt={`${feature.title} icon`}
                    width={60}
                    height={60}
                    className="h-[50px] w-[50px] object-contain"
                  />
                </div>
                <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  {feature.eyebrow}
                </span>
              </div>

              <h3 className="relative mt-5 text-xl font-semibold tracking-tight text-zinc-900">
                {feature.title}
              </h3>
              <p className="relative mt-2 text-[15px] leading-relaxed text-zinc-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="mt-10 flex justify-center"
        >
          <Link
            href="/resume/templates"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 sm:text-base"
          >
            Create Resume
          </Link>
        </motion.div>

        {/* Resume Templates Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-24"
        >
          <div className="text-center mb-12">
            <h3 className="font-display text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Professional Templates
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-base text-zinc-600">
              Choose from our collection of beautifully designed, ATS-friendly templates.
            </p>
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {templates.slice(0, 8).map((template) => (
                <CarouselItem key={template.id} className="pl-4 basis-1/2 sm:basis-1/3 lg:basis-1/4">
                  <ResumeTemplateCard template={template} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center gap-2 mt-8">
              <CarouselPrevious className="static translate-y-0 bg-white border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300" />
              <CarouselNext className="static translate-y-0 bg-white border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300" />
            </div>
          </Carousel>
        </motion.div>

      </div>
    </section>
  );
}
