"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import TechText from "@/components/ui/tech-text";
import { BlurInText } from "@/components/ui/blur-in-text";
import { cn } from "@/lib/utils";

const LINES = ["Find your next", "job, faster."];
const MAX_SIZE = 152;
const LEADING = 0.95;
// TechText centres the text block in its box and fits the ink into 66% of the height,
// so the box is taller than the type.
const BOX = 3.1;
const STAGGER = 0.04;
const INTRO_SECONDS = 0.1 + (LINES.join("").replace(/ /g, "").length - 1) * STAGGER + 1.1;
// Each line starts where the previous one's letters end, so the stagger reads as one sentence.
const LINE_DELAYS = LINES.map(
  (_, index) => 0.1 + LINES.slice(0, index).join("").replace(/ /g, "").length * STAGGER,
);

type Layout = { size: number; top: number; indents: number[] };

export function HeroHeadline() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [handoff, setHandoff] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const ctx = document.createElement("canvas").getContext("2d");
    if (!el || !ctx) return;
    let alive = true;

    // The DOM headline plays the blur-in, then hands over to the canvas. Both are laid out from the
    // same font metrics so the swap does not jump: shared size, matching baselines and ink edges.
    const measure = () => {
      if (!alive) return;
      const family = getComputedStyle(el).fontFamily;
      ctx.font = `600 100px ${family}`;
      const widestEm = Math.max(...LINES.map((line) => ctx.measureText(line).width)) / 100;
      const size = Math.min(MAX_SIZE, (el.clientWidth * 0.98) / widestEm);

      ctx.font = `600 ${size}px ${family}`;
      const [first, last] = [ctx.measureText(LINES[0]), ctx.measureText(LINES[LINES.length - 1])];
      const block = first.actualBoundingBoxAscent + (LINES.length - 1) * LEADING * size + last.actualBoundingBoxDescent;
      const canvasBaseline = (BOX * size - block) / 2 + first.actualBoundingBoxAscent;
      const fontHeight = first.fontBoundingBoxAscent + first.fontBoundingBoxDescent;
      const domBaseline = (LEADING * size - fontHeight) / 2 + first.fontBoundingBoxAscent;
      setLayout({
        size,
        top: domBaseline - canvasBaseline,
        // TechText starts each line at its ink edge; the DOM starts it at the glyph origin.
        indents: LINES.map((line) => ctx.measureText(line).actualBoundingBoxLeft),
      });
    };

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    document.fonts?.ready.then(measure);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!layout || handoff) return;
    const timer = setTimeout(() => setHandoff(true), reduceMotion ? 0 : INTRO_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [layout, handoff, reduceMotion]);

  return (
    <div ref={ref} className="relative font-display text-zinc-900">
      {/* Always present for SEO and screen readers; visible until the canvas takes over. */}
      <h1
        style={layout ? { fontSize: layout.size, lineHeight: LEADING } : undefined}
        className={cn(
          "text-[clamp(3.25rem,10.5vw,9.5rem)] leading-[0.95] font-semibold tracking-[-0.03em] transition-opacity duration-300",
          handoff && "opacity-0",
        )}
      >
        {LINES.map((line, index) => (
          <span key={line} className="block" style={layout ? { marginLeft: layout.indents[index] } : undefined}>
            <BlurInText text={line} delay={LINE_DELAYS[index]} stagger={STAGGER} />
          </span>
        ))}
      </h1>

      {layout && handoff ? (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute"
          // TechText indents left-aligned text by 5% of its width; widening the box
          // by 1/0.9 and pulling it left by that 5% lines the ink up with the page grid.
          style={{ top: layout.top, left: `${-500 / 90}%`, width: `${100 / 0.9}%`, height: BOX * layout.size }}
        >
          <TechText
            text={LINES.join("\n")}
            lineHeight={LEADING}
            align="left"
            fontSize={layout.size}
            fontWeight={600}
            letterSpacing={-0.03}
            accentColor="#0068a8"
          />
        </motion.div>
      ) : null}
    </div>
  );
}
