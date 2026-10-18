import type { ReactElement } from "react";
import { siteConfig } from "@/lib/seo";

// Shared 1200x630 social card rendered with next/og (Satori).
// Used by app/opengraph-image.tsx and app/twitter-image.tsx so every page
// gets a real, correctly-sized social preview instead of a square logo.

export const ogSize = { width: 1200, height: 630 } as const;
export const ogContentType = "image/png";
export const ogAlt =
  "Craftiv: job matching, ATS checker and AI resume builder";

const domain = siteConfig.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

export function OgCard(): ReactElement {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "linear-gradient(135deg, #3159e7 0%, #1b2f8f 100%)",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "rgba(255,255,255,0.16)",
            fontSize: 36,
            fontWeight: 800,
          }}
        >
          C
        </div>
        <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>
          Craftiv
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
            maxWidth: 960,
          }}
        >
          Find your next job, faster.
        </div>
        <div style={{ fontSize: 34, opacity: 0.9, maxWidth: 900, lineHeight: 1.3 }}>
          Match roles to your resume, tailor each application, and track it
          to the offer.
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.18)",
            padding: "12px 26px",
            borderRadius: 999,
            fontSize: 28,
            fontWeight: 600,
          }}
        >
          {domain}
        </div>
      </div>
    </div>
  );
}
