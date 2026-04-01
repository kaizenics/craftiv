import Link from "next/link";

export const metadata = {
	title: "Data Deletion | BoostCV",
	description:
		"Learn how to request deletion of your BoostCV account and associated data.",
};

const LAST_UPDATED = "April 1, 2026";

export default function DataDeletionPage() {
	return (
		<main className="min-h-screen bg-white px-4 py-12 sm:px-6 lg:px-8">
			<div className="mx-auto w-full max-w-4xl bg-white sm:p-10">
				<h1 className="text-3xl font-bold tracking-tight text-zinc-900">
					Data Deletion
				</h1>
				<p className="mt-2 text-sm text-zinc-500">Last updated: {LAST_UPDATED}</p>

				<div className="mt-8 space-y-8 text-zinc-700">
					<section>
						<h2 className="text-xl font-semibold text-zinc-900">Overview</h2>
						<p className="mt-3 leading-7">
							At BoostCV, we respect your right to control your personal data. You
							can request deletion of data associated with your account at any
							time. This page explains what data is deleted, how to submit a
							request, and what to expect.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-zinc-900">What Data Is Deleted</h2>
						<p className="mt-3 leading-7">
							When your request is verified and approved, the following data is
							permanently removed from our active systems:
						</p>
						<ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
							<li>
								Account information (name, email, profile image, and
								authentication-related records).
							</li>
							<li>
								Resume documents and generated content, including contact,
								experience, education, skills, and summary data.
							</li>
							<li>
								Cover letter documents and related editor content you created.
							</li>
							<li>
								AI review outputs, suggestions, and generation history linked to
								your account.
							</li>
							<li>
								Usage records and analytics tied directly to your user account.
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-zinc-900">How To Request Data Deletion</h2>
						<p className="mt-3 leading-7">To request deletion, follow these steps:</p>
						<ol className="mt-3 list-decimal space-y-2 pl-6 leading-7">
							<li>
								Send an email to{" "}
								<a
									href="mailto:info@boostcv.app"
									className="font-medium text-zinc-900 underline underline-offset-2"
								>
									info@boostcv.app
								</a>{" "}
								with the subject line: Data Deletion Request.
							</li>
							<li>Include the email address associated with your BoostCV account.</li>
							<li>
								Include any additional identifiers that help us verify your
								account (for example, your latest document title).
							</li>
							<li>
								We will verify your identity and confirm once deletion is
								completed.
							</li>
						</ol>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-zinc-900">Processing Time</h2>
						<p className="mt-3 leading-7">
							Most verified requests are completed within 7 business days.
							Complex cases may take longer, but we will keep you updated by
							email.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-zinc-900">Important Notes</h2>
						<ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
							<li>
								Some limited records may be retained where legally required
								(for example, fraud prevention or compliance logs).
							</li>
							<li>
								Deletion is permanent and cannot be reversed once completed.
							</li>
						</ul>
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
