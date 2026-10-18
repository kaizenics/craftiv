"use client";

import type { ReactNode } from "react";
import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";
import "lenis/dist/lenis.css";

// Same feel as kaizenics.tech. Scoped to marketing pages; app pages keep native scrolling.
const options = { lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 2 };

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <>{children}</>;
  return (
    <ReactLenis root options={options}>
      {children}
    </ReactLenis>
  );
}
