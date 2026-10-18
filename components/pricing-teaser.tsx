import Link from "next/link";
import { Check } from "lucide-react";
import { BlurInText } from "@/components/ui/blur-in-text";
import { BlurFade } from "@/components/ui/blur-fade";
import {
  CREDIT_ACTIONS,
  CREDIT_UNITS_PER_CREDIT,
  formatCreditValue,
} from "@/lib/credit-costs";

const freeTools = [
  "Saved job searches",
  "Match scoring",
  "Application tracker",
  "Job clipper",
  "Resume and cover letter builder",
  "PDF and Word downloads",
];

export function PricingTeaser() {
  return (
    <section className="border-t border-zinc-200 bg-white py-24 font-sans lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="max-w-3xl font-display text-4xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-5xl lg:text-6xl">
          <BlurInText text="Search and track for free. Pay only for AI." />
        </h2>

        <div className="mt-14 grid gap-4 lg:grid-cols-2">
          <BlurFade className="flex flex-col rounded-3xl border border-zinc-200 bg-zinc-50 p-8 sm:p-10">
            <p className="text-sm font-medium text-zinc-500">Free, always</p>
            <p className="mt-3 font-display text-7xl font-semibold tracking-tight text-zinc-900">$0</p>
            <ul className="mt-10 mb-10 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {freeTools.map((tool) => (
                <li key={tool} className="flex items-start gap-3 text-[15px] text-zinc-700">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {tool}
                </li>
              ))}
            </ul>
            <Link
              href="/sign-up"
              className="mt-auto inline-flex h-11 w-fit items-center rounded-xl border border-zinc-300 bg-white px-5 text-[15px] font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
            >
              Start free
            </Link>
          </BlurFade>

          <BlurFade delay={0.15} className="flex flex-col rounded-3xl bg-zinc-900 p-8 text-white sm:p-10">
            <p className="text-sm font-medium text-zinc-400">Pay as you go</p>
            <p className="mt-3 max-w-sm text-lg leading-relaxed text-zinc-300">
              One-time credit packs that never expire. New accounts get 1 free credit.
            </p>
            <ul className="mt-8 divide-y divide-white/10">
              {CREDIT_ACTIONS.map((action) => (
                <li key={action.id} className="flex items-baseline justify-between gap-4 py-3.5">
                  <span>
                    <span className="block text-[15px] font-medium">{action.label}</span>
                    <span className="block text-sm text-zinc-400">{action.detail}</span>
                  </span>
                  <span className="shrink-0 font-display text-2xl font-semibold tabular-nums">
                    {formatCreditValue(action.costUnits)}
                    <span className="ml-1.5 font-sans text-sm font-normal text-zinc-400">
                      {action.costUnits === CREDIT_UNITS_PER_CREDIT ? "credit" : "credits"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/pricing"
              className="mt-10 inline-flex h-11 w-fit items-center rounded-xl bg-white px-5 text-[15px] font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
            >
              See pricing
            </Link>
          </BlurFade>
        </div>
      </div>
    </section>
  );
}
