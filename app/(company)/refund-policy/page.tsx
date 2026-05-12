import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Refund Policy",
  description:
    "Review Craftiv's refund eligibility, timelines, and how to request support for billing concerns.",
  path: "/refund-policy",
});

const LAST_UPDATED = "April 20, 2026";

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl bg-white sm:p-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Refund Policy
        </h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 space-y-8 text-zinc-700">
          <section>
            <h2 className="text-xl font-semibold text-zinc-900">Overview</h2>
            <p className="mt-3 leading-7">
              We want you to be confident using Craftiv. This policy explains
              when refunds may be granted for subscriptions and purchases made
              through our billing system.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">
              Subscription Charges
            </h2>
            <p className="mt-3 leading-7">
              Monthly subscriptions are billed in advance. If you cancel, your
              plan remains active until the end of the current billing period.
              Cancellation prevents future renewals.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">
              Refund Eligibility
            </h2>
            <p className="mt-3 leading-7">
              Refund requests are reviewed case-by-case. We generally consider
              refunds for first-time subscription purchases if requested within
              7 days of the charge and when there has been minimal product usage.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
              <li>Duplicate or accidental charges may qualify for full refund.</li>
              <li>Technical billing errors may qualify after verification.</li>
              <li>
                Charges outside the eligible window or after significant usage
                may not be refundable.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">
              Non-Refundable Cases
            </h2>
            <p className="mt-3 leading-7">Refunds are typically not granted for:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
              <li>Partial billing periods after cancellation.</li>
              <li>Change of mind after extended or heavy use.</li>
              <li>Requests made beyond the stated refund window.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">
              How To Request A Refund
            </h2>
            <p className="mt-3 leading-7">
              Email{" "}
              <a
                href="mailto:billing@gocraftiv.com"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                billing@gocraftiv.com
              </a>{" "}
              with your account email, transaction receipt, and the reason for
              your request. We usually respond within 1 business day.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">
              Processing Time
            </h2>
            <p className="mt-3 leading-7">
              If approved, refunds are issued to the original payment method.
              Processing times may vary by bank or card provider
              and can take 5 to 10 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">
              Policy Updates
            </h2>
            <p className="mt-3 leading-7">
              We may update this Refund Policy from time to time. Changes are
              effective when posted, and the date above will be updated.
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-zinc-200 pt-6">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

