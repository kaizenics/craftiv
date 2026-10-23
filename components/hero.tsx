import Link from "next/link";
import { unstable_cache } from "next/cache";
import { Button } from "@/components/ui/button";
import { CompanyMarquee } from "@/components/company-marquee";
import { HeroHeadline } from "@/components/hero-headline";
import { HeroJobTicker, type TickerJob } from "@/components/hero-job-ticker";
import { remotiveAdapter } from "@/lib/job-sources/remotive";

// Remotive's free tier allows only a few requests a day for the whole site, so
// the feed is cached for 6 hours. A failed fetch throws, which unstable_cache
// does not store, so the next render retries instead of caching an empty list.
const getLatestRemoteJobs = unstable_cache(
  async (): Promise<TickerJob[]> => {
    const jobs =
      (await remotiveAdapter.search?.({ query: "", location: "", limit: 8 }, AbortSignal.timeout(8_000))) ?? [];
    return jobs.map((job) => ({
      id: job.externalId,
      title: job.title,
      company: job.company,
      url: job.url,
      postedAt: job.postedAt?.toISOString() ?? null,
    }));
  },
  ["home-hero-remotive-feed"],
  { revalidate: 60 * 60 * 6 },
);

async function loadFeed(): Promise<TickerJob[]> {
  try {
    return await getLatestRemoteJobs();
  } catch {
    // The hero must render without the feed rather than fail the page.
    return [];
  }
}

export async function Hero() {
  const jobs = await loadFeed();

  return (
    <section className="flex min-h-[100dvh] flex-col overflow-x-clip bg-white font-sans dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-4 pt-32 pb-10 sm:px-6 lg:px-8 lg:pb-14">
        <HeroHeadline />

        <div className="mt-10 grid gap-10 border-t border-zinc-200 pt-8 lg:mt-14 lg:grid-cols-12 lg:gap-8">
          {/* CSS fades, not BlurFade: they start at first paint instead of waiting for hydration, which held LCP back on phones. */}
          <div className="hero-in lg:col-span-6" style={{ animationDelay: "0.5s" }}>
            <p className="max-w-lg text-base leading-relaxed text-pretty text-zinc-600 sm:text-lg dark:text-zinc-400">
              Craftiv matches roles to your resume, tailors each application,
              and tracks it all the way to the offer.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="h-11 rounded-xl px-6 text-base font-semibold">
                <Link href="/sign-up">Start free</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 rounded-xl px-6 text-base font-semibold">
                <Link href="#features">See how it works</Link>
              </Button>
              <span className="text-sm text-zinc-500 sm:ml-2">1 free credit. No subscription.</span>
            </div>
          </div>

          {jobs.length > 0 ? (
            <div className="hero-in lg:col-span-5 lg:col-start-8" style={{ animationDelay: "0.7s" }}>
              <HeroJobTicker jobs={jobs} />
            </div>
          ) : null}
        </div>
      </div>

      <CompanyMarquee />
    </section>
  );
}
