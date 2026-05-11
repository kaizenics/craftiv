"use client";

import Image from "next/image";

const logos = [
  { src: "/marquee/bossjob.png", alt: "Bossjob" },
  { src: "/marquee/fiverr.png", alt: "Fiverr" },
  { src: "/marquee/indeed.png", alt: "Indeed" },
  { src: "/marquee/jobstreet.png", alt: "JobStreet" },
  { src: "/marquee/linkedin2.webp", alt: "LinkedIn" },
  { src: "/marquee/olj.png", alt: "OnlineJobs" },
  { src: "/marquee/upwork.png", alt: "Upwork" },
  { src: "/marquee/virtualstaff.png", alt: "VirtualStaff" },
];

export function CompanyMarquee() {
  const items = [...logos, ...logos];

  return (
    <section className="border-zinc-200 bg-zinc-50 py-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
        <p className="shrink-0 text-base font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:text-lg">
          Optimized for job platforms
        </p>
        <div className="relative w-full overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-zinc-50 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-zinc-50 to-transparent" />
          <div className="marquee-track flex w-max items-center gap-10 sm:gap-12">
            {items.map((logo, idx) => (
              <div key={`${logo.alt}-${idx}`} className="shrink-0">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={180}
                  height={56}
                  className="h-9 w-auto object-contain sm:h-10"
                  sizes="180px"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .marquee-track {
          animation: marquee 28s linear infinite;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
