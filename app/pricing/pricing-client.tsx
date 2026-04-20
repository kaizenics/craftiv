"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { NavbarComponent } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { loadAndInitPaddle } from "@/lib/paddle";
import { authClient } from "@/lib/auth-client";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Sparkles,
} from "@/components/ui/icons";

type SubscriptionPlan = "free" | "plus" | "pro";

type Plan = {
  name: string;
  price: number;
  cadence: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  featured: boolean;
  paddlePriceId: string;
  icon: ComponentType<{ className?: string }>;
  badge: string;
};

const PRICING = {
  currencySymbol: "$",
  currencyCode: "USD" as const,
  plusPrice: 2,
  proPrice: 5,
};

function isSubscriptionPlan(value: string | null): value is SubscriptionPlan {
  return value === "free" || value === "plus" || value === "pro";
}

export function PricingClient() {
  const { data: session } = authClient.useSession();
  const [activeCheckoutPlan, setActiveCheckoutPlan] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);

  const paddleClientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "";
  const paddleSuccessUrl = process.env.NEXT_PUBLIC_PADDLE_SUCCESS_URL || "";
  const paddleEnv =
    (process.env.NEXT_PUBLIC_PADDLE_ENV as "sandbox" | "production" | undefined) ||
    "sandbox";

  const priceIds = {
    plusUSD: process.env.NEXT_PUBLIC_PADDLE_PRICE_PLUS_USD || "",
    proUSD: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_USD || "",
  };

  const plans: Plan[] = [
    {
      name: "Free",
      price: 0,
      cadence: "/month",
      description: "Get started and test the builder.",
      features: [
        "Unlimited PDF/DOCX downloads",
        "1 resume and cover letter template",
        "Manual editing tools",
        "Community email support",
      ],
      cta: "Start Free",
      href: "/sign-up",
      featured: false,
      paddlePriceId: "",
      icon: FileText,
      badge: "Starter",
    },
    {
      name: "Plus",
      price: PRICING.plusPrice,
      cadence: "/month",
      description: "Great for active job seekers.",
      features: [
        "Unlimited PDF/DOCX downloads",
        "20 resume and cover letter templates",
        "AI-powered features",
        "ATS optimization tools",
      ],
      cta: "Get Plus",
      href: "/sign-up",
      featured: true,
      paddlePriceId: priceIds.plusUSD,
      icon: Sparkles,
      badge: "Most Popular",
    },
    {
      name: "Pro",
      price: PRICING.proPrice,
      cadence: "/month",
      description: "For power users who need maximum output.",
      features: [
        "Everything in Plus",
        "Advanced AI optimization",
        "Priority support",
        "Early access to new features",
      ],
      cta: "Get Pro",
      href: "/sign-up",
      featured: false,
      paddlePriceId: priceIds.proUSD,
      icon: ShieldCheck,
      badge: "Advanced",
    },
  ];

  useEffect(() => {
    if (!session?.user) {
      setCurrentPlan(null);
      return;
    }
    const storedPlan = localStorage.getItem("craftiv.subscription.plan");
    if (isSubscriptionPlan(storedPlan)) {
      setCurrentPlan(storedPlan);
      return;
    }
    setCurrentPlan("free");
  }, [session?.user]);

  const openPaddleCheckout = async (plan: Plan) => {
    if (plan.name === "Free") return;
    if (!plan.paddlePriceId) {
      alert("This plan is not configured yet. Please set Paddle price IDs.");
      return;
    }
    if (!paddleClientToken) {
      alert("Missing NEXT_PUBLIC_PADDLE_CLIENT_TOKEN.");
      return;
    }
    if (!plan.paddlePriceId.startsWith("pri_")) {
      alert(`Invalid Paddle price ID for ${plan.name}. It must start with pri_.`);
      return;
    }
    if (paddleEnv === "sandbox" && !paddleClientToken.startsWith("test_")) {
      alert("Paddle env is sandbox, but client token does not start with test_.");
      return;
    }
    if (paddleEnv === "production" && paddleClientToken.startsWith("test_")) {
      alert("Paddle env is production, but client token is a test token.");
      return;
    }

    try {
      setActiveCheckoutPlan(plan.name);
      const normalizedPlan = plan.name.toLowerCase() as Exclude<SubscriptionPlan, "free">;
      const paddle = await loadAndInitPaddle(paddleClientToken, paddleEnv, (event) => {
        if (
          typeof event === "object" &&
          event !== null &&
          "name" in event &&
          (event as { name?: string }).name === "checkout.completed"
        ) {
          localStorage.setItem("craftiv.subscription.plan", normalizedPlan);
          localStorage.setItem("craftiv.subscription.status", "active");
          setCurrentPlan(normalizedPlan);
          return;
        }
        if (
          typeof event === "object" &&
          event !== null &&
          "name" in event &&
          "detail" in event &&
          (event as { name?: string }).name === "checkout.error" &&
          (event as { detail?: string }).detail === "transaction_default_checkout_url_not_set"
        ) {
          alert(
            "Paddle checkout setup is incomplete: set a Default payment link in your Paddle dashboard (Checkout settings), then try again."
          );
        }
      });
      const successUrl =
        paddleSuccessUrl ||
        `${window.location.origin}/dashboard/settings?subscribed=1&plan=${normalizedPlan}`;
      paddle.Checkout.open({
        items: [{ priceId: plan.paddlePriceId, quantity: 1 }],
        settings: {
          displayMode: "overlay",
          theme: "light",
          locale: "en",
          successUrl,
        },
      });
    } catch (error) {
      console.error("Paddle checkout failed:", error);
      alert("Unable to open checkout. Please try again.");
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
            Build resumes faster, optimize for ATS, and generate tailored cover
            letters. Checkout will be powered by Paddle.
          </p>
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
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

              <ul className="mt-6 space-y-2.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex items-start gap-2.5 text-sm ${
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

              {currentPlan === plan.name.toLowerCase() ? (
                <span
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
                    plan.featured
                      ? "bg-white/20 text-white"
                      : "bg-zinc-200 text-zinc-700"
                  }`}
                >
                  Current plan
                </span>
              ) : plan.name === "Free" ? (
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
              ) : (
                <button
                  type="button"
                  data-paddle-price-id={plan.paddlePriceId}
                  onClick={() => void openPaddleCheckout(plan)}
                  disabled={activeCheckoutPlan === plan.name}
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                    plan.featured
                      ? "bg-white text-zinc-900 hover:bg-zinc-100"
                      : "bg-primary text-white hover:bg-primary/90"
                  }`}
                >
                  {activeCheckoutPlan === plan.name ? "Opening checkout..." : plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6">
          <h2 className="text-lg font-semibold text-zinc-900">FAQ</h2>
          <div className="mt-4 space-y-4 text-sm text-zinc-700">
            <div>
              <p className="font-semibold text-zinc-900">Can I cancel anytime?</p>
              <p className="mt-1 text-zinc-600">
                Yes. You can cancel your subscription anytime from your billing portal.
              </p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">What payment provider do you use?</p>
              <p className="mt-1 text-zinc-600">
                We use Paddle for secure checkout and subscription management.
              </p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Are taxes included?</p>
              <p className="mt-1 text-zinc-600">
                Paddle handles taxes and invoicing based on your billing location.
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
