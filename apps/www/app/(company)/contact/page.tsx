import Link from "next/link";

export const metadata = {
	title: "Contact Support | Craftiv",
	description:
		"Reach Craftiv support through our official Facebook page for account, billing, and technical questions.",
};

const SUPPORT_HOURS = "Monday to Friday, 9:00 AM - 6:00 PM (UTC)";
const FACEBOOK_SUPPORT_URL = "https://facebook.com/gocraftiv";

const supportChannels = [
	{
		title: "Craftiv Facebook Support",
		link: FACEBOOK_SUPPORT_URL,
		detail:
			"For now, all customer support inquiries are handled via our official Craftiv Facebook page.",
		response: "Typical response: within 24 hours",
		cta: "Message Craftiv on Facebook",
	},
];

export default function ContactPage() {
	return (
		<main className="min-h-screen bg-white px-4 py-12 sm:px-6 lg:px-8">
			<div className="mx-auto w-full max-w-5xl bg-white sm:p-10">
				<div className="border-b border-zinc-200 pb-8">
					<h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900">
						Contact Craftiv Support
					</h1>
					<p className="mt-3 max-w-2xl text-zinc-600">
						Need help with your account, resume downloads, or billing? Reach out
						to our team and we will guide you.
					</p>
				</div>

				<section className="mt-8">
					<h2 className="text-xl font-semibold text-zinc-900">Support Channels</h2>
					<div className="mt-4 grid gap-4 sm:grid-cols-2">
						{supportChannels.map((channel) => (
							<article
								key={channel.title}
								className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-5"
							>
								<h3 className="text-base font-semibold text-zinc-900">{channel.title}</h3>
								<p className="mt-2 text-sm text-zinc-600 leading-6">{channel.detail}</p>
								<p className="mt-3 text-sm text-zinc-500">{channel.response}</p>
								<a
									href={channel.link}
									target="_blank"
									rel="noreferrer"
									className="mt-4 inline-block text-sm font-medium text-zinc-900 underline underline-offset-2"
								>
									{channel.cta}
								</a>
							</article>
						))}
					</div>
				</section>

				<section className="mt-10 grid gap-6 rounded-xl border border-zinc-200 bg-zinc-50/60 p-6 sm:grid-cols-2">
					<div>
						<h2 className="text-lg font-semibold text-zinc-900">Support Hours</h2>
						<p className="mt-2 text-sm text-zinc-600">{SUPPORT_HOURS}</p>
						<p className="mt-2 text-sm text-zinc-600">
							For urgent issues affecting exports or account access, please include
							&quot;Urgent&quot; at the start of your Facebook message.
						</p>
					</div>
					<div>
						<h2 className="text-lg font-semibold text-zinc-900">Quick Links</h2>
						<ul className="mt-2 space-y-2 text-sm text-zinc-700">
							<li>
								<Link href="/privacy" className="underline underline-offset-2">
									Privacy Policy
								</Link>
							</li>
							<li>
								<Link href="/terms" className="underline underline-offset-2">
									Terms of Service
								</Link>
							</li>
							<li>
								<Link href="/dashboard" className="underline underline-offset-2">
									Go to Dashboard
								</Link>
							</li>
						</ul>
					</div>
				</section>

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
