"use client";

import { OwnAiSettings } from "@/components/dashboard/own-ai-settings";

export default function IntegrationsSettings() {
  return (
    <div className="py-8">
      <h1 className="font-display text-3xl font-bold text-foreground">Integrations</h1>
      <p className="text-muted-foreground mt-1 mb-8">Connect outside services to Craftiv</p>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">Your own AI</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Use your own AI provider key for Craftiv&apos;s AI features instead of credits.
        </p>
        <OwnAiSettings />
      </section>
    </div>
  );
}
