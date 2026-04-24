"use client";

import type { ComponentType } from "react";
import Link from "next/link";

import { Footer } from "@/components/footer";
import { NavbarComponent } from "@/components/navbar";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Sparkles,
} from "@/components/ui/icons";
import { getAppUrl } from "@/lib/app-url";

type Plan = {
  name: string;
  price: number;
  cadence: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  featured: boolean;
  icon: ComponentType<{ className?: string }>;
  badge: string;
};

const PRICING = {
  currencySymbol: "$",
  plusPrice: 2,
  proPrice: 5,
};

const plans: Plan[] = [
  {
    name: "Free",
    price: 0,
    cadence: "/month",
    description: "Start building immediately with the core editor and export tools.",
    features: [
      "Unlimited PDF and DOCX downloads",
      "Core resume and cover letter builder",
      "Manual editing tools",
      "Community email support",
    ],
    cta: "Start Free",
    href: getAppUrl("/resume/templates"),
    featured: false,
    icon: FileText,
    badge: "Starter",
  },
  {
    name: "Plus",
    price: PRICING.plusPrice,
    cadence: "/month",
    description: "Built for active job seekers who want faster, smarter iteration.",
    features: [
      "Everything in Free",
      "Expanded template access",
      "ATS Checker",
      "AI Resume Assistant",
      "Spell Checker",
      "AI cover letter generation",
    ],
    cta: "Create account",
    href: getAppUrl("/sign-up"),
    featured: true,
    icon: Sparkles,
    badge: "Most Popular",
  },
  {
    name: "Pro",
    price: PRICING.proPrice,
    cadence: "/month",
    description: "For users who want the full optimization stack and early access.",
    features: [
      "Everything in Plus",
      "Advanced AI optimization",
      "Priority support",
      "Early access to new features",
    ],
    cta: "Create account",
    href: getAppUrl("/sign-up"),
    featured: false,
    icon: ShieldCheck,
    badge: "Advanced",
  },
];

export function PricingClient() {
  return (
    <>
      <NavbarComponent />
      <main className="min-h-screen bg-white px-4 pt-32 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="border-b border-zinc-200 pb-8 text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-zinc-900">
              Our Pricing
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-zinc-600">
              Choose a plan, then continue inside the builder on
              {" "}
              <span className="font-semibold text-zinc-900">app.gocraftiv.com</span>.
            </p>
          </div>

          <section className="mt-10 grid items-start gap-5 md:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all hover:-translate-y-0.5 ${
                  plan.featured
                    ? "border bg-primary text-white shadow-lg shadow-primary/25"
                    : "border-zinc-200 bg-zinc-50/70 text-zinc-900 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                        plan.featured
                          ? "bg-white/20 text-white"
                          : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      <plan.icon className="h-4 w-4" />
                    </span>
                    <p
                      className={`text-sm font-semibold ${
                        plan.featured ? "text-zinc-100" : "text-zinc-600"
                      }`}
                    >
                      {plan.name}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                      plan.featured
                        ? "bg-white text-zinc-900"
                        : "bg-zinc-200 text-zinc-700"
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>

                <p
                  className={`mt-4 text-sm ${
                    plan.featured ? "text-zinc-200" : "text-zinc-600"
                  }`}
                >
                  {plan.description}
                </p>

                <div className="mt-4 flex items-end gap-1">
                  <p className="text-4xl font-bold">
                    {plan.price === 0
                      ? `${PRICING.currencySymbol}0`
                      : `${PRICING.currencySymbol}${plan.price}`}
                  </p>
                  <p
                    className={`mb-1 text-sm ${
                      plan.featured ? "text-zinc-300" : "text-zinc-500"
                    }`}
                  >
                    {plan.cadence}
                  </p>
                </div>

                <ul className="mt-6">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className={`mb-2.5 flex items-start gap-2.5 text-sm last:mb-0 ${
                        plan.featured ? "text-zinc-100" : "text-zinc-700"
                      }`}
                    >
                      <CheckCircle2
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          plan.featured ? "text-white" : "text-primary"
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    plan.featured
                      ? "bg-white text-zinc-900 hover:bg-zinc-100"
                      : "bg-primary text-white hover:bg-primary/90"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </section>

          <section className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6">
            <h2 className="text-lg font-semibold text-zinc-900">FAQ</h2>
            <div className="mt-4 space-y-4 text-sm text-zinc-700">
              <div>
                <p className="font-semibold text-zinc-900">Where do I manage my plan?</p>
                <p className="mt-1 text-zinc-600">
                  Billing, upgrades, and document management live inside the product app on
                  {" "}
                  <span className="font-medium text-zinc-900">app.gocraftiv.com</span>.
                </p>
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Can I cancel anytime?</p>
                <p className="mt-1 text-zinc-600">
                  Yes. Subscription management remains self-serve inside the app.
                </p>
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Why split the app and site?</p>
                <p className="mt-1 text-zinc-600">
                  Keeping the marketing site and builder separate makes future releases safer and easier to maintain.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
