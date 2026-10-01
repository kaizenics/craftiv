"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { NavbarComponent } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/trpc/client";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Sparkles,
} from "@/components/ui/icons";
import { AI_PROVIDERS, AI_PROVIDER_IDS } from "@/lib/ai-providers";

const OWN_AI_SETTINGS_PATH = "/dashboard/settings/integrations";
const OWN_AI_PROVIDER_NAMES = AI_PROVIDER_IDS.map((id) => AI_PROVIDERS[id].label);

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

  const plans: Plan[] = [
    {
      name: "Active",
      price: PRICING.activePrice,
      creditLabel: "5 credits",
      upgradeKey: "active",
      subscriptionMatch: "active",
      description: "Great for active job seekers.",
      features: [
        "2 fully optimized resumes + 1 leftover Review credit",
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
        "6 fully optimized resumes",
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
        "12 fully optimized resumes + 1 leftover Review credit",
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
        <div className="border-b border-zinc-200 pb-8 text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-zinc-900">
            Our Pricing
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-zinc-600">
            Pay once, use credits anytime, and optimize resumes with no recurring
            subscription.
          </p>
        </div>

        <section className="mx-auto mt-10 grid max-w-5xl items-stretch gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex h-full flex-col rounded-2xl border p-6 transition-all hover:-translate-y-0.5 ${
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
                className={`mt-4 text-sm ${
                  plan.featured ? "text-zinc-200" : "text-zinc-600"
                }`}
              >
                {plan.description}
              </p>

              <div className="mt-4">
                {plan.originalPrice ? (
                  <p
                    className={`text-sm font-semibold line-through ${
                      plan.featured ? "text-zinc-300" : "text-zinc-400"
                    }`}
                  >
                    {`${PRICING.currencySymbol}${formatPrice(plan.originalPrice)}`}
                  </p>
                ) : null}
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

        <section
          aria-labelledby="own-ai-heading"
          className="mx-auto mt-5 max-w-5xl rounded-2xl border border-zinc-200 bg-zinc-50/70 p-6"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                <KeyRound className="h-4 w-4" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="own-ai-heading" className="text-lg font-semibold text-zinc-900">
                    Bring your own AI
                  </h2>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    Included with any pack
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-sm text-zinc-600">
                  Already have an API key? Connect it and use every Craftiv AI feature without
                  spending credits. You pay your AI provider directly for what you use.
                </p>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-zinc-700">
                  {OWN_AI_PROVIDER_NAMES.map((name) => (
                    <li key={name} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Link
              href={
                session?.user
                  ? OWN_AI_SETTINGS_PATH
                  : `/sign-in?redirect=${encodeURIComponent(OWN_AI_SETTINGS_PATH)}`
              }
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              {session?.user ? "Connect your AI" : "Sign in to connect"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6">
          <h2 className="text-lg font-semibold text-zinc-900">FAQ</h2>
          <div className="mt-4 space-y-4 text-sm text-zinc-700">
            <div>
              <p className="font-semibold text-zinc-900">Can I cancel anytime?</p>
              <p className="mt-1 text-zinc-600">
                There is nothing to cancel. Credits are one-time purchases and never expire.
              </p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Can I use my own AI API key?</p>
              <p className="mt-1 text-zinc-600">
                Yes. Buy any pack once, then connect an OpenAI, Claude, Gemini or OpenRouter key
                in Settings. AI features then run on your key and cost 0 credits, and you can
                switch back to credits anytime.
              </p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">What payment provider do you use?</p>
              <p className="mt-1 text-zinc-600">
                We use Polar for secure checkout and payment processing.
              </p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Are taxes included?</p>
              <p className="mt-1 text-zinc-600">
                Taxes and invoicing are handled based on your billing location.
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
