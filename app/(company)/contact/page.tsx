import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock, MessageCircle } from "lucide-react";
import { createPageMetadata } from "@/lib/seo";
import { NavbarComponent } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { BlurInText } from "@/components/ui/blur-in-text";
import { BlurFade } from "@/components/ui/blur-fade";

export const metadata = createPageMetadata({
	title: "Contact Support",
	description:
		"Reach Craftiv support through our official Facebook page for account, billing, and technical questions.",
	path: "/contact",
});

const FACEBOOK_SUPPORT_URL = "https://facebook.com/gocraftiv";

const quickLinks = [
	{ label: "Common questions", detail: "Jobs, scoring, credits and sharing", href: "/#faq" },
	{ label: "Pricing", detail: "Free tier and one-time credit packs", href: "/pricing" },
	{ label: "Privacy policy", detail: "What we store and why", href: "/privacy" },
	{ label: "Terms of service", detail: "The rules for using Craftiv", href: "/terms" },
	{ label: "Your dashboard", detail: "Resumes, jobs and settings", href: "/dashboard" },
];

export default function ContactPage() {
	return (
		<>
			<NavbarComponent />
			<main className="bg-white font-sans text-zinc-900">
				<section className="mx-auto max-w-7xl px-4 pt-36 pb-16 sm:px-6 lg:px-8 lg:pt-44">
					<h1 className="max-w-3xl font-display text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
						<BlurInText text="Talk to a person." />
					</h1>
					<p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
						<BlurInText
							text="Questions about your account, downloads or billing? Message the team and we will help you sort it out."
							delay={0.4}
							stagger={0.01}
						/>
					</p>
				</section>

				<section className="mx-auto grid max-w-7xl gap-5 px-4 pb-24 sm:px-6 lg:grid-cols-12 lg:px-8">
					<BlurFade className="flex flex-col rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10 lg:col-span-7">
						<span className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
							<MessageCircle className="size-5" aria-hidden />
						</span>
						<h2 className="mt-6 font-display text-3xl font-semibold tracking-tight">Message us on Facebook</h2>
						<p className="mt-3 max-w-md text-base leading-relaxed text-zinc-600">
							For now, every support request is handled through the official Craftiv Facebook page.
						</p>
						<div className="mt-8 flex items-baseline gap-3">
							<span className="font-display text-6xl font-semibold tracking-tight tabular-nums">24h</span>
							<span className="text-sm text-zinc-500">typical reply time</span>
						</div>
						<a
							href={FACEBOOK_SUPPORT_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-10 inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[opacity,transform] hover:opacity-90 active:scale-[0.98]"
						>
							Open Messenger
							<ArrowUpRight className="size-4" aria-hidden />
						</a>
					</BlurFade>

					<BlurFade delay={0.15} className="flex flex-col rounded-3xl bg-zinc-50 p-8 sm:p-10 lg:col-span-5">
						<span className="inline-flex size-11 items-center justify-center rounded-2xl bg-white text-zinc-700">
							<Clock className="size-5" aria-hidden />
						</span>
						<h2 className="mt-6 font-display text-3xl font-semibold tracking-tight">Support hours</h2>
						<p className="mt-6 font-display text-4xl font-semibold tracking-tight">Mon to Fri</p>
						<p className="mt-1 text-lg text-zinc-600">9:00 to 18:00 UTC</p>
						<p className="mt-auto pt-10 text-sm leading-relaxed text-zinc-600">
							Locked out, or an export not working? Start your message with{" "}
							<span className="font-semibold text-zinc-900">&quot;Urgent&quot;</span> and we will look at it first.
						</p>
					</BlurFade>
				</section>

				<section className="border-t border-zinc-200 bg-white py-24">
					<div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
						<div className="lg:col-span-4">
							<h2 className="font-display text-4xl font-semibold tracking-tight text-balance">
								<BlurInText text="Maybe it is already answered" />
							</h2>
							<p className="mt-5 max-w-sm text-base leading-relaxed text-zinc-600">
								A few places that often save a message.
							</p>
						</div>
						<BlurFade delay={0.15} className="lg:col-span-8">
							<ul className="border-t border-zinc-200">
								{quickLinks.map((link) => (
									<li key={link.href} className="border-b border-zinc-200">
										<Link href={link.href} className="group flex items-center justify-between gap-6 py-6">
											<span>
												<span className="block text-lg font-medium text-zinc-900 sm:text-xl">{link.label}</span>
												<span className="mt-1 block text-sm text-zinc-500">{link.detail}</span>
											</span>
											<ArrowRight
												className="size-5 shrink-0 text-zinc-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-zinc-900"
												aria-hidden
											/>
										</Link>
									</li>
								))}
							</ul>
						</BlurFade>
					</div>
				</section>
			</main>
			<Footer />
		</>
	);
}
