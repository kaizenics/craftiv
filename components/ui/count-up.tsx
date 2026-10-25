"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useReducedMotion, useSpring } from "motion/react";

/**
 * Count Up from React Bits (reactbits.dev, MIT), trimmed to what the site uses.
 * Springs from the shown value to `to` once in view, and again whenever `to` changes.
 */
export function CountUp({ to, from = 0, duration = 1, className }: { to: number; from?: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const value = useMotionValue(from);
  // Same spring tuning as React Bits: duration sets how loose the spring is.
  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);
  const spring = useSpring(value, { damping, stiffness });
  const inView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (!inView) return;
    value.set(to);
    if (reduce) spring.jump(to);
  }, [inView, to, value, spring, reduce]);

  // Written straight to the DOM so a running count never re-renders React.
  useEffect(
    () =>
      spring.on("change", (latest) => {
        if (ref.current) ref.current.textContent = Math.round(latest).toLocaleString();
      }),
    [spring],
  );

  return (
    <span ref={ref} className={className}>
      {(reduce ? to : from).toLocaleString()}
    </span>
  );
}
