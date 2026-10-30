import Link from "next/link";
import { notFound } from "next/navigation";

import { NavbarComponent } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ArrowRight } from "@/components/ui/icons";
import { getResumeExample, resumeExamples } from "@/lib/data/resume-examples";
import { templates } from "@/lib/data/templates";
import { breadcrumbJsonLd, buildFaqPageJsonLd, createPageMetadata } from "@/lib/seo";
import { ExamplePreview, UseExampleButton } from "./example-preview";

export const dynamicParams = false;

export function generateStaticParams() {
  return resumeExamples.map((e) => ({ slug: e.slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const example = getResumeExample((await params).slug);
  if (!example) return {};
  return createPageMetadata({
    title: `${example.jobTitle} Resume Example (ATS-Friendly)`,
    description: example.description,
    path: `/resume-examples/${example.slug}`,
  });
}

export default async function ResumeExamplePage({ params }: PageProps) {
  const example = getResumeExample((await params).slug);
  if (!example) notFound();

  const template = templates.find((t) => t.id === example.templateId);
  const related = resumeExamples.filter((e) => e.slug !== example.slug).slice(0, 6);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            buildFaqPageJsonLd(example.faqs),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Resume Examples", path: "/resume-examples" },
              { name: example.jobTitle, path: `/resume-examples/${example.slug}` },
            ]),
          ]),
        }}
      />
      <NavbarComponent />
      <main className="bg-white font-sans text-zinc-900">
        <section className="mx-auto grid max-w-7xl gap-12 px-4 pt-36 pb-20 sm:px-6 lg:grid-cols-12 lg:px-8 lg:pt-44">
          <div className="lg:col-span-6">
            <Link href="/resume-examples" className="text-sm text-zinc-500 hover:text-zinc-900">
              Resume examples
            </Link>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {example.jobTitle} resume example
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">{example.intro}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <UseExampleButton data={example.resume} />
              <span className="text-sm text-zinc-500">Free to edit and download as PDF or Word.</span>
            </div>

            <h2 className="mt-14 font-display text-2xl font-semibold tracking-tight">
              Keywords for {example.jobTitle.toLowerCase()} resumes
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Tracking systems match these terms literally. Use the ones you can back up with real experience.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {example.keywords.map((keyword) => (
                <li key={keyword} className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700">
                  {keyword}
                </li>
              ))}
            </ul>

            <h2 className="mt-14 font-display text-2xl font-semibold tracking-tight">How to write it</h2>
            <ol className="mt-5 space-y-6">
              {example.tips.map((tip, i) => (
                <li key={tip.title} className="flex gap-4">
                  <span className="font-display text-xl font-semibold text-primary tabular-nums">{i + 1}</span>
                  <div>
                    <h3 className="font-medium">{tip.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600">{tip.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:col-span-6">
            <div className="lg:sticky lg:top-28">
              <ExamplePreview data={example.resume} color={template?.primaryColor ?? "#1e1e1e"} />
              {template && (
                <p className="mt-3 text-center text-sm text-zinc-500">Shown in the {template.name} template</p>
              )}
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-200 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="font-display text-3xl font-semibold tracking-tight">Common questions</h2>
            <dl className="mt-8 divide-y divide-zinc-200 border-y border-zinc-200">
              {example.faqs.map((faq) => (
                <div key={faq.question} className="py-6">
                  <dt className="font-medium">{faq.question}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-zinc-600">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-t border-zinc-200 bg-zinc-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight">More resume examples</h2>
            <ul className="mt-6 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((e) => (
                <li key={e.slug} className="border-b border-zinc-200">
                  <Link href={`/resume-examples/${e.slug}`} className="group flex items-center justify-between py-4">
                    <span>{e.jobTitle}</span>
                    <ArrowRight className="size-4 text-zinc-400 transition-transform group-hover:translate-x-1" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
