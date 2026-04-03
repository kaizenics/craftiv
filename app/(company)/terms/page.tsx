import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Layro",
  description: "Read the terms that govern your use of Layro.",
};

const LAST_UPDATED = "March 15, 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl bg-white sm:p-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 space-y-8 text-zinc-700">
          <section>
            <h2 className="text-xl font-semibold text-zinc-900">
              Acceptance of Terms
            </h2>
            <p className="mt-3 leading-7">
              By accessing or using Layro, you agree to these Terms of Service.
              If you do not agree, you should not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">
              Description of Service
            </h2>
            <p className="mt-3 leading-7">
              Layro provides software tools for creating, editing, and exporting
              resume documents and related career content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">
              User Responsibilities
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
              <li>You are responsible for content you upload or create.</li>
              <li>You must provide accurate account and billing information.</li>
              <li>You may not use the service for unlawful or abusive conduct.</li>
              <li>
                You may not attempt to interfere with platform security or
                reliability.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">
              Intellectual Property
            </h2>
            <p className="mt-3 leading-7">
              Layro and related branding, software, and original content are
              owned by us or our licensors. You retain ownership of resume content
              you create and submit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">
              Account Suspension or Termination
            </h2>
            <p className="mt-3 leading-7">
              We may suspend or terminate access if these Terms are violated, if
              required by law, or to protect users and platform integrity.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">
              Disclaimer of Warranties
            </h2>
            <p className="mt-3 leading-7">
              The service is provided on an &quot;as is&quot; and &quot;as available&quot;
              basis without warranties of any kind, to the fullest extent
              permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">
              Limitation of Liability
            </h2>
            <p className="mt-3 leading-7">
              To the maximum extent permitted by law, Layro is not liable for
              indirect, incidental, special, consequential, or punitive damages,
              or any loss of profits, data, or goodwill.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">Changes to Terms</h2>
            <p className="mt-3 leading-7">
              We may update these Terms from time to time. Continued use of the
              service after changes become effective means you accept the revised
              Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">Contact</h2>
            <p className="mt-3 leading-7">
              For questions regarding these Terms, contact{" "}
              <a
                href="mailto:legal@layro.app"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                legal@layro.app
              </a>
              .
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
