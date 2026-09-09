"use client";

import { motion } from "motion/react";
import { useEffect, useState, type RefObject } from "react";

export type CursorPoint = { x: number; y: number };
export type CursorVariant = "arrow" | "text";

/**
 * Where the demo cursor should sit, in coordinates local to `containerRef`.
 *
 * Targets are found by `data-cursor-target` rather than passed as refs: the
 * three previews mount and unmount as the tour cycles, so a ref map would need
 * threading through every one of them to stay in sync.
 */
export function useCursorTarget(
  containerRef: RefObject<HTMLElement | null>,
  targetKey: string | null,
  /** Bump to force a re-measure after a layout change. */
  revision: number,
): CursorPoint | null {
  const [point, setPoint] = useState<CursorPoint | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !targetKey) return;

    const measure = () => {
      const element = container.querySelector<HTMLElement>(
        `[data-cursor-target="${targetKey}"]`,
      );
      // Leaving the cursor where it was beats snapping it to the origin while a
      // preview is mid-transition and its targets are briefly absent.
      if (!element) return;

      const containerBox = container.getBoundingClientRect();
      const targetBox = element.getBoundingClientRect();
      // The stage is scaled during a zoom, so both rects come back in screen
      // pixels. Dividing by the live scale converts them to the container's own
      // layout space, which is where the cursor and the zoom maths both live.
      const scale = container.offsetWidth > 0 ? containerBox.width / container.offsetWidth : 1;
      const safeScale = scale > 0 ? scale : 1;
      setPoint({
        x: (targetBox.left - containerBox.left + targetBox.width / 2) / safeScale,
        y: (targetBox.top - containerBox.top + targetBox.height / 2) / safeScale,
      });
    };

    // Measured on the next frame: the target often mounts with the beat that
    // points at it, so reading the rect synchronously here gets a stale box.
    const frame = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [containerRef, targetKey, revision]);

  return point;
}

/** Layout size of an element, unaffected by any transform applied to it. */
export function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(() => {
      setSize({ width: element.offsetWidth, height: element.offsetHeight });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

/** The I-beam's hotspot is its middle; the arrow's is its tip. */
const GLYPH_OFFSET: Record<CursorVariant, { x: number; y: number }> = {
  arrow: { x: 0, y: 0 },
  text: { x: -10, y: -10 },
};

// Snappier than the default spring so the pointer actually settles inside the
// arrive beat rather than still drifting when the press is due.
const TRAVEL = { type: "spring", stiffness: 190, damping: 24, mass: 0.6 } as const;

/** The pointer itself. Purely decorative, so it stays out of the a11y tree. */
export function DemoCursor({
  point,
  clicking,
  clickKey,
  variant = "arrow",
}: {
  point: CursorPoint | null;
  clicking: boolean;
  /** Changes per beat so each press remounts the pulse and replays it. */
  clickKey: number;
  variant?: CursorVariant;
}) {
  // Gates the press on the travel finishing. Keyed off the motion callbacks
  // rather than the beat, because a beat starts the moment the schedule says so
  // while the spring is still carrying the pointer across the panel -- which is
  // what made the pulse fire, and the glyph dip, in mid-flight.
  const [arrived, setArrived] = useState(true);

  if (!point) return null;

  const offset = GLYPH_OFFSET[variant];
  const pressing = clicking && arrived;

  return (
    <>
      {/* Pinned to the spot that was pressed, in a wrapper that does not travel.
          Housing it inside the moving container dragged a still-fading pulse
          along to the next target, which read as a press firing early. It also
          finishes inside the press beat, so nothing survives into the next
          journey. */}
      {pressing ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-30"
          style={{ left: point.x, top: point.y }}
        >
          <motion.span
            key={clickKey}
            className="absolute -left-2.5 -top-2.5 block size-5 rounded-full border border-primary bg-primary/25"
            initial={{ scale: 0.3, opacity: 0.9 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.34, ease: "easeOut" }}
          />
        </div>
      ) : null}

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-30"
        initial={false}
        animate={{ x: point.x + offset.x, y: point.y + offset.y }}
        transition={TRAVEL}
        onAnimationStart={() => setArrived(false)}
        onAnimationComplete={() => setArrived(true)}
      >
        <motion.svg
          viewBox="0 0 24 24"
          className="block size-5 drop-shadow-[0_2px_4px_rgba(15,23,42,0.35)]"
          initial={false}
          animate={{ scale: pressing ? 0.8 : 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {variant === "text" ? (
            // Real text fields swap the pointer for an I-beam, so the demo does
            // too -- an arrow parked over a field being typed into reads wrong.
            // Drawn twice: a thick white pass underneath carries the contrast.
            <g fill="none" strokeLinecap="round">
              <path d="M9.5 3.5 H14.5 M12 3.5 V20.5 M9.5 20.5 H14.5" stroke="#ffffff" strokeWidth="4.2" />
              <path d="M9.5 3.5 H14.5 M12 3.5 V20.5 M9.5 20.5 H14.5" stroke="#0b0f14" strokeWidth="1.8" />
            </g>
          ) : (
            /* White outline keeps the pointer readable over cards, tinted panels
               and the dashed empty states alike. */
            <path
              d="M5 2.5 L5 19.2 L9.1 15.3 L11.7 21.2 L14.6 19.9 L12 14.1 L17.6 14.1 Z"
              fill="#0b0f14"
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          )}
        </motion.svg>
      </motion.div>
    </>
  );
}

/** Blinking caret shown at the end of a field the cursor is typing into. */
export function TypingCaret() {
  return (
    <motion.span
      aria-hidden="true"
      className="ml-px inline-block h-[1em] w-px translate-y-[0.15em] bg-primary"
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear", times: [0, 0.5, 0.5, 1] }}
    />
  );
}
