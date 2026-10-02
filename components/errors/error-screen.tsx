import type { ReactNode } from "react";

/** Shared layout for the not-found and error pages. */
export function ErrorScreen({
  code,
  title,
  description,
  actions,
}: {
  code: string;
  title: string;
  description: string;
  actions: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 font-sans dark:bg-zinc-950">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">{code}</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">{description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{actions}</div>
      </div>
    </main>
  );
}

export const primaryActionClass =
  "inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90";

export const secondaryActionClass =
  "inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";
