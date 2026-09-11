import type { ReactNode } from "react";

import { Sparkles } from "@/components/ui/icons";

/**
 * The label every page puts above sample data during its tour. Shared so the
 * wording and look cannot drift between pages -- someone who has seen one
 * sample should recognise the next one instantly as not theirs.
 */
export function SampleBanner({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      role="note"
      className="flex items-start gap-2.5 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm"
    >
      <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <p>
        <span className="font-semibold text-foreground">{title}</span>{" "}
        <span className="text-muted-foreground">{children}</span>
      </p>
    </div>
  );
}
