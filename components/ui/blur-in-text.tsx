"use client";

import { Fragment, useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

// Letter-by-letter blur-in the first time the text scrolls into view, ported from kaizenics.tech.
// Each word stays in a no-wrap group so lines only break between words; the plain sentence is
// kept as real text for screen readers and search, and the animated letters are hidden from them.
export function BlurInText({
  text,
  delay = 0,
  stagger = 0.03,
}: {
  text: string;
  delay?: number;
  stagger?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  let index = 0;

  return (
    <span ref={ref}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {text.split(" ").map((word, w) => (
          <Fragment key={`${word}-${w}`}>
            {w > 0 && " "}
            <span className="inline-block whitespace-nowrap">
              {[...word].map((letter) => {
                const order = index++;
                return (
                  <motion.span
                    key={order}
                    className="inline-block"
                    initial={reduce ? false : { opacity: 0, filter: "blur(10px)", y: 6 }}
                    animate={inView ? { opacity: 1, filter: "blur(0px)", y: 0 } : undefined}
                    transition={{ duration: 1.1, delay: delay + order * stagger, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {letter}
                  </motion.span>
                );
              })}
            </span>
          </Fragment>
        ))}
      </span>
    </span>
  );
}
