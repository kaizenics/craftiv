import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
	title: "Coming Soon",
	description: "New Craftiv tools are coming soon.",
	path: "/coming-soon",
	noIndex: true,
});

export default function ComingSoonPage() {
	return (
		<main className="flex min-h-screen items-center justify-center px-4">
			<h1 className="text-center text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
				Coming Soon
			</h1>
		</main>
	);
}
