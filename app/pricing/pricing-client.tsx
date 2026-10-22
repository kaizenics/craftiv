"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { NavbarComponent } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FAQ } from "@/components/faq";
import { pricingFaqs } from "@/lib/data/faqs";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/trpc/client";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "@/components/ui/icons";
import { CREDIT_PACKS, JOB_TAILOR_COST } from "@/lib/credit-costs";

// Everything here costs nothing; only AI features spend credits.
const FREE_FEATURES = [
  "1 free credit when you confirm your email",
  "Saved job searches with daily or weekly matches",
  "Match score and missing keywords for every job",
  "Application tracker from saved to offer",
  "Resume and cover letter builder",
  "Unlimited PDF and Word downloads",
  "Use your own AI key for every AI feature, 0 credits",
];


type SubscriptionPlan = "free" | "active" | "plus" | "pro";

type Plan = {
  name: string;
  price: number;
  originalPrice?: number;
  discountLabel?: string;
  creditLabel: string;
  upgradeKey: "active" | "plus" | "pro";
  subscriptionMatch?: SubscriptionPlan;
  description: string;
  features: string[];
  cta: string;
  featured: boolean;
  icon: ComponentType<{ className?: string }>;
  badge: string;
};

const PRICING = {
  currencySymbol: "$",
  currencyCode: "USD" as const,
  activePrice: 1.95,
  plusPrice: 3.95,
  proOriginalPrice: 8,
  proDiscountRate: 0.1,
};

export function PricingClient() {
  const router = useRouter();
  const { isLoading: isAuthLoading } = useAuth();
  const { data: session } = authClient.useSession();
  const [activeCheckoutPlan, setActiveCheckoutPlan] = useState<string | null>(null);
  const createCheckout = trpc.user.createCheckout.useMutation();
  const { data: subscription } = trpc.user.subscription.useQuery(undefined, {
    enabled: !!session?.user,
  });
  const currentPlan: SubscriptionPlan | null = session?.user
    ? (subscription?.plan as SubscriptionPlan | undefined) ?? "free"
    : null;

  const formatPrice = (value: number) =>
    Number.isInteger(value) ? value.toString() : value.toFixed(2);
  const proDiscountedPrice = PRICING.proOriginalPrice * (1 - PRICING.proDiscountRate);

  // Derived from the packs the payment webhook grants, so the promise always matches the real tailoring cost.
  const tailoredJobs = (plan: (typeof CREDIT_PACKS)[number]["plan"]) =>
    `${Math.floor(CREDIT_PACKS.find((pack) => pack.plan === plan)!.creditUnits / JOB_TAILOR_COST)} jobs tailored, each with a resume and cover letter`;

  const plans: Plan[] = [
    {
      name: "Active",
      price: PRICING.activePrice,
      creditLabel: "5 credits",
      upgradeKey: "active",
      subscriptionMatch: "active",
      description: "Great for active job seekers.",
      features: [
        tailoredJobs("active"),
        "Job match score before and after with missing keywords",
        "AI-rewritten bullets tailored to the job description",
        "Choose from ATS Optimized Templates",
        "No subscription, credits never expire",
      ],
      cta: "Get Active",
      featured: false,
      icon: Sparkles,
      badge: "",
    },
    {
      name: "Plus",
      price: PRICING.plusPrice,
      creditLabel: "12 credits",
      upgradeKey: "plus",
      subscriptionMatch: "plus",
      description: "For users who need more optimizations per week.",
      features: [
        tailoredJobs("plus"),
        "Job match score before and after with missing keywords",
        "AI-rewritten bullets tailored to the job description",
        "Choose from ATS Optimized Templates",
        "No subscription, credits never expire",
      ],
      cta: "Get Plus",
      featured: true,
      icon: ShieldCheck,
      badge: "Most Popular",
    },
    {
      name: "Pro",
      price: proDiscountedPrice,
      originalPrice: PRICING.proOriginalPrice,
      discountLabel: "10% Off",
      creditLabel: "25 credits",
      upgradeKey: "pro",
      subscriptionMatch: "pro",
      description: "Designed for high-volume applicants and career switchers.",
      features: [
        tailoredJobs("pro"),
        "Job match score before and after with missing keywords",
        "AI-rewritten bullets tailored to the job description",
        "Choose from ATS Optimized Templates",
        "Best for frequent applicants and career switchers",
        "No subscription, credits never expire",
      ],
      cta: "Get Pro",
      featured: false,
      icon: Sparkles,
      badge: "",
    },
  ];

  const startPlanUpgrade = async (plan: Plan) => {
    if (isAuthLoading) return;
    if (!session?.user) {
      router.push(`/sign-in?redirect=${encodeURIComponent("/pricing")}`);
      return;
    }

    try {
      setActiveCheckoutPlan(plan.upgradeKey);
      const { checkoutUrl } = await createCheckout.mutateAsync({
        plan: plan.upgradeKey,
      });
      window.location.assign(checkoutUrl);
    } catch (error) {
      console.error("Failed to open Polar checkout:", error);
      alert("Unable to start checkout right now. Please try again.");
    } finally {
      setActiveCheckoutPlan(null);
    }
  };

  return (
    <>
      <NavbarComponent />
      <main className="min-h-screen bg-white px-4 pt-32 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
        <div className="pb-8 text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-zinc-900">
            Our Pricing
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-zinc-600">
            Pay once, use credits anytime, and optimize resumes with no recurring
            subscription.
          </p>
        </div>

        <section className="mx-auto mt-10 grid max-w-6xl items-stretch gap-5 md:grid-cols-2 lg:grid-cols-4">
          <article className="relative flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold text-zinc-600">Free</p>
            </div>
            <p className="mt-4 min-h-10 text-sm text-zinc-600">Everything you need to search, match and track jobs.</p>
            <div className="mt-4">
              <p aria-hidden className="invisible text-sm font-semibold">$0</p>
              <p className="text-4xl font-bold">{PRICING.currencySymbol}0</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-bold uppercase tracking-wide text-primary">
                  Free forever
                </p>
              </div>
            </div>
            <ul className="mt-6">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="mb-2.5 flex items-start gap-2.5 text-sm text-zinc-700 last:mb-0">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-6">
              <Link
                href={session?.user ? "/dashboard/job-hunter" : "/sign-up"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50"
              >
                {session?.user ? "Open Job Hunter" : "Start free"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>

          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex h-full flex-col rounded-2xl border p-6 ${
                plan.featured
                  ? "border bg-primary text-white shadow-lg shadow-primary/25"
                  : "border-zinc-200 bg-zinc-50/70 text-zinc-900"
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
                {currentPlan !== null &&
                (plan.subscriptionMatch ?? plan.name.toLowerCase()) === currentPlan ? (
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                      plan.featured
                        ? "bg-white text-zinc-900"
                        : "bg-zinc-200 text-zinc-700"
                    }`}
                  >
                    Last purchased
                  </span>
                ) : plan.badge ? (
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                      plan.featured
                        ? "bg-white text-zinc-900"
                        : "bg-zinc-200 text-zinc-700"
                    }`}
                  >
                    {plan.badge}
                  </span>
                ) : null}
              </div>

              <p
                className={`mt-4 min-h-10 text-sm ${
                  plan.featured ? "text-zinc-200" : "text-zinc-600"
                }`}
              >
                {plan.description}
              </p>

              <div className="mt-4">
                {/* Every card reserves the strike-through row, so prices and badges line up across cards. */}
                <p
                  aria-hidden={!plan.originalPrice}
                  className={`text-sm font-semibold line-through ${plan.originalPrice ? "" : "invisible"} ${
                    plan.featured ? "text-zinc-300" : "text-zinc-400"
                  }`}
                >
                  {`${PRICING.currencySymbol}${formatPrice(plan.originalPrice ?? plan.price)}`}
                </p>
                <p className="text-4xl font-bold">
                  {`${PRICING.currencySymbol}${formatPrice(plan.price)}`}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-bold uppercase tracking-wide ${
                      plan.featured
                        ? "bg-white/15 text-white"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {plan.creditLabel}
                  </p>
                  {plan.discountLabel ? (
                    <p
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                        plan.featured
                          ? "bg-green-200/90 text-green-900"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {plan.discountLabel}
                    </p>
                  ) : null}
                </div>
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

              <div className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={() => void startPlanUpgrade(plan)}
                  disabled={isAuthLoading || activeCheckoutPlan === plan.upgradeKey || createCheckout.isPending}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                    plan.featured
                      ? "bg-white text-zinc-900 hover:bg-zinc-100"
                      : "bg-primary text-white hover:bg-primary/90"
                  }`}
                >
                  {isAuthLoading
                    ? "Checking account..."
                    : !session?.user
                      ? `Sign in for ${plan.name}`
                      : activeCheckoutPlan === plan.upgradeKey
                        ? "Opening checkout..."
                        : currentPlan !== null &&
                            (plan.subscriptionMatch ?? plan.name.toLowerCase()) === currentPlan
                          ? "Buy Again"
                          : plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </section>


        </div>
        <FAQ faqs={pricingFaqs} divider={false} subtitle="Credits, payment and using your own AI key." />
      </main>
      <Footer />
    </>
  );
}
