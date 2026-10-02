import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

/** Header and backdrop for public shared resumes and cover letters. */
export function SharedPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-100 font-sans">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/craftiv.png" alt="Craftiv" width={28} height={28} className="h-7 w-7" />
            <span className="text-sm font-semibold text-zinc-900">Craftiv</span>
          </Link>
          <Link
            href="/resume/templates"
            className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Make your own
          </Link>
        </div>
      </header>
      <main className="overflow-x-auto px-4 py-8">{children}</main>
    </div>
  );
}
