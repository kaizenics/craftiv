import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Craftiv",
  description: "Learn how Craftiv collects, uses, and protects your information.",
};

const LAST_UPDATED = "March 15, 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl bg-white sm:p-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 space-y-8 text-zinc-700">
          <section>
            <h2 className="text-xl font-semibold text-zinc-900">Overview</h2>
            <p className="mt-3 leading-7">
              Craftiv (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) provides tools that
              help users build and export resumes. This policy explains what data
              we collect, how we use it, and the choices you have.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">Data We Collect</h2>
            <p className="mt-3 leading-7">
              We may collect account details (such as email), resume content that
              you enter (experience, education, skills, and contact details), and
              technical data (such as browser type and basic usage logs).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">How We Use Data</h2>
            <p className="mt-3 leading-7">We use information to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
              <li>Provide and improve the Craftiv platform.</li>
              <li>Generate, store, and export your resume documents.</li>
              <li>Secure accounts and prevent fraud or abuse.</li>
              <li>Respond to support requests and product feedback.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">Data Sharing</h2>
            <p className="mt-3 leading-7">
              We do not sell personal data. We may share information with trusted
              service providers that help us run the product (for example,
              infrastructure, authentication, or analytics providers), subject to
              contractual privacy obligations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">Data Retention</h2>
            <p className="mt-3 leading-7">
              We keep data only as long as needed to provide the service, meet
              legal obligations, resolve disputes, and enforce agreements. You may
              request deletion of your account and associated resume data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">Your Rights</h2>
            <p className="mt-3 leading-7">
              Depending on your location, you may have rights to access, correct,
              delete, or export your personal data, and to object to certain
              processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">Security</h2>
            <p className="mt-3 leading-7">
              We apply reasonable technical and organizational measures to protect
              your data. No system is perfectly secure, but we continuously work to
              safeguard user information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">
              Changes To This Policy
            </h2>
            <p className="mt-3 leading-7">
              We may update this Privacy Policy from time to time. When we do, we
              will revise the &quot;Last updated&quot; date above.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">Contact</h2>
            <p className="mt-3 leading-7">
              Questions about this policy can be sent to{" "}
              <a
                href="mailto:privacy@gocraftiv.com"
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                privacy@gocraftiv.com
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
