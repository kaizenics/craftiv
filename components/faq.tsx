"use client";

import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How long does it take to create a resume?",
    answer:
      "Most users complete their resume in under 10 minutes. Our intuitive builder guides you through each section, and AI-powered suggestions help you write compelling content quickly.",
  },
  {
    question: "Is Craftiv free to use?",
    answer:
      "Yes. You can start with a free credit, then buy one-time credit packs when you need more optimizations. There is no monthly subscription and credits do not expire.",
  },
  {
    question: "Are the resumes ATS-friendly?",
    answer:
      "Absolutely. Every template is designed to pass through Applicant Tracking Systems. We use clean formatting, proper heading structures, and standard fonts to ensure your resume gets seen by recruiters.",
  },
  {
    question: "Can I edit my resume after downloading?",
    answer:
      "Yes! Your resumes are saved to your account and can be edited anytime. You can also download in multiple formats including PDF, DOCX, and plain text.",
  },
  {
    question: "Do you offer templates for different industries?",
    answer:
      "We have 50+ professionally designed templates tailored for various industries including tech, finance, healthcare, creative fields, and more. Each template is customizable to match your personal brand.",
  },
  {
    question: "How does the AI resume optimization work?",
    answer:
      "Our AI analyzes your experience and the job description you're targeting. It suggests improvements to your bullet points, identifies missing keywords, and helps you quantify your achievements for maximum impact.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative bg-white py-20 lg:py-12 font-sans">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-600">
            Everything you need to know about Craftiv.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12"
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-6 data-[state=open]:bg-white data-[state=open]:shadow-sm transition-all duration-200"
              >
                <AccordionTrigger className="text-left text-base font-medium text-zinc-900 hover:no-underline py-5 [&[data-state=open]>svg]:rotate-180">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-zinc-600 leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-zinc-600">
            Still have questions?{" "}
            <a
              href="#contact"
              className="font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-700 transition-colors"
            >
              Contact us
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

