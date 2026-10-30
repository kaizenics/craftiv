import Link from "next/link";

import { NavbarComponent } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ArrowRight } from "@/components/ui/icons";
import { resumeExamples } from "@/lib/data/resume-examples";
import { breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Resume Examples by Job Title",
  description:
    "Free, ATS-friendly resume examples for popular jobs, with the keywords recruiters search for. Open any example in the builder and download it free.",
  path: "/resume-examples",
});

export default function ResumeExamplesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Resume Examples", path: "/resume-examples" },
            ]),
          ),
        }}
      />
      <NavbarComponent />
      <main className="bg-white font-sans text-zinc-900">
        <section className="mx-auto max-w-7xl px-4 pt-36 pb-24 sm:px-6 lg:px-8 lg:pt-44">
          <h1 className="max-w-3xl font-display text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
            Resume examples by job title
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
            Each example is ATS-friendly and comes with the keywords recruiters filter on. Open one in the builder,
            make it yours and download it free. No subscription.
          </p>
          <ul className="mt-14 grid gap-x-8 border-t border-zinc-200 sm:grid-cols-2 lg:grid-cols-3">
            {resumeExamples.map((e) => (
              <li key={e.slug} className="border-b border-zinc-200">
                <Link href={`/resume-examples/${e.slug}`} className="group flex items-center justify-between gap-6 py-6">
                  <span className="text-lg font-medium">{e.jobTitle}</span>
                  <ArrowRight
                    className="size-5 shrink-0 text-zinc-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-zinc-900"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
