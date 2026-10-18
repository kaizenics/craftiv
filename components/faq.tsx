import Link from "next/link";
import { Plus } from "lucide-react";
import { BlurInText } from "@/components/ui/blur-in-text";
import { BlurFade } from "@/components/ui/blur-fade";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { homeFaqs as faqs } from "@/lib/data/faqs";

export function FAQ() {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-zinc-200 bg-white py-24 font-sans lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
        <div className="lg:col-span-4">
          <BlurFade className="lg:sticky lg:top-32">
            <h2 className="font-display text-4xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-5xl">
              <BlurInText text="Questions, answered" />
            </h2>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-zinc-600">
              <BlurInText text="How Craftiv finds jobs, scores them and what you pay for." delay={0.4} stagger={0.01} />
            </p>
            <p className="mt-8 text-sm text-zinc-600">
              Still unsure?{" "}
              <Link
                href="/contact"
                className="font-medium text-zinc-900 underline underline-offset-4 transition-colors hover:text-zinc-600"
              >
                Contact us
              </Link>
            </p>
          </BlurFade>
        </div>

        <BlurFade delay={0.15} className="lg:col-span-8">
        <Accordion
          type="single"
          collapsible
          defaultValue="item-0"
          className="border-t border-zinc-200"
        >
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              value={`item-${index}`}
              className="border-b border-zinc-200 data-open:bg-transparent"
            >
              {/* The house trigger's chevrons are hidden in favour of a plus that turns into a close mark. */}
              <AccordionTrigger className="items-center px-0 py-6 hover:no-underline **:data-[slot=accordion-trigger-icon]:hidden">
                <span className="text-lg font-medium text-zinc-900 sm:text-xl">{faq.question}</span>
                <Plus
                  aria-hidden
                  className="size-5 shrink-0 text-zinc-400 transition-transform duration-300 group-hover/accordion-trigger:text-zinc-900 group-aria-expanded/accordion-trigger:rotate-45 group-aria-expanded/accordion-trigger:text-zinc-900"
                />
              </AccordionTrigger>
              {/* -mx-4 cancels the house content's fixed side padding so answers align with questions. */}
              <AccordionContent className="-mx-4 max-w-2xl pb-7 text-[15px] leading-relaxed text-zinc-600 sm:text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        </BlurFade>
      </div>
    </section>
  );
}
