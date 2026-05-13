import { mockTestimonials } from "../lib/testimonials-data";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Testimonials() {
  const midpoint = Math.ceil(mockTestimonials.length / 2);
  const firstRow = mockTestimonials.slice(0, midpoint);
  const secondRow = mockTestimonials.slice(midpoint);
  const firstRowItems = [...firstRow, ...firstRow];
  const secondRowItems = [...secondRow, ...secondRow];

  return (
    <section className="bg-white py-20 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            What Our Users Say
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base text-zinc-600 dark:text-zinc-300">
            Real testimonials from VA and remote professionals applying for global roles.
          </p>
        </div>

        <div className="mt-12 space-y-5">
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent dark:from-zinc-950 sm:w-14" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent dark:from-zinc-950 sm:w-14" />
            <div className="testimonial-marquee-left flex w-max gap-5 py-2">
              {firstRowItems.map((testimonial, idx) => (
                <article
                  key={`top-${testimonial.name}-${idx}`}
                  className="w-[300px] shrink-0 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:w-[360px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-800">
                      {getInitials(testimonial.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-white">{testimonial.name}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                    &quot;{testimonial.quote}&quot;
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent dark:from-zinc-950 sm:w-14" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent dark:from-zinc-950 sm:w-14" />
            <div className="testimonial-marquee-right flex w-max gap-5 py-2">
              {secondRowItems.map((testimonial, idx) => (
                <article
                  key={`bottom-${testimonial.name}-${idx}`}
                  className="w-[300px] shrink-0 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:w-[360px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-800">
                      {getInitials(testimonial.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-white">{testimonial.name}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                    &quot;{testimonial.quote}&quot;
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
