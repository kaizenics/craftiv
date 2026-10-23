"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";
import "lenis/dist/lenis.css";

// Same feel as kaizenics.tech. Scoped to marketing pages; app pages keep native scrolling.
const options = { lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 2 };

const noSubscribe = () => () => {};
const isTouch = () => window.matchMedia("(pointer: coarse)").matches;

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  // Touch scrolling is already native and smooth; Lenis there only adds a per-frame loop that cost seconds of main thread on phones.
  const touch = useSyncExternalStore(noSubscribe, isTouch, () => true);
  if (reduceMotion || touch) return <>{children}</>;
  return (
    <ReactLenis root options={options}>
      {children}
    </ReactLenis>
  );
}
