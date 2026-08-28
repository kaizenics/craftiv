"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Check, Copy } from "@/components/ui/icons";
import { buildBookmarkletUrl } from "@/lib/job-hunter/bookmarklet";

/**
 * Install surface for the clipper bookmarklet.
 *
 * Rendered as a real anchor carrying the javascript: URL so it can be dragged
 * straight to the bookmarks bar, which is the only way a bookmarklet can be
 * installed. It is deliberately inert on click -- clicking it here would run
 * the extraction against Craftiv's own page, which is never what anyone wants.
 */
export function JobClipperPanel({ appUrl }: { appUrl: string }) {
  const [copied, setCopied] = useState(false);
  const bookmarklet = useMemo(() => buildBookmarkletUrl(appUrl), [appUrl]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(bookmarklet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; dragging the link still works.
    }
  }

  return (
    <section
      aria-labelledby="clipper-heading"
      className="rounded-xl border border-border bg-card p-4"
    >
      <h2 id="clipper-heading" className="font-heading text-base font-semibold">
        Clip jobs while you browse
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Drag this button to your bookmarks bar. On any job page, select the description and click
        it — the job opens here ready to score.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={bookmarklet}
          draggable
          onClick={(event) => event.preventDefault()}
          className="inline-flex h-9 cursor-grab items-center rounded-lg border border-border bg-muted px-3 text-sm font-medium active:cursor-grabbing"
          title="Drag me to your bookmarks bar"
        >
          Clip to Craftiv
        </a>

        <Button variant="outline" size="sm" onClick={copy} className="h-9">
          {copied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        The clipper runs only in your browser, on pages you open yourself. Craftiv never visits the
        job site on your behalf.
      </p>
    </section>
  );
}
