"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { X } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type TourStep = {
  /** CSS selector for the element to spotlight. */
  target: string;
  title: string;
  body: string;
  /** Preferred bubble side; another is chosen when this one has no room. */
  placement?: Side;
};

type Rect = { top: number; left: number; width: number; height: number };
type Side = "top" | "bottom" | "left" | "right";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

const HOLE_PADDING = 8;
const BUBBLE_GAP = 14;
const BUBBLE_WIDTH = 320;
const VIEWPORT_MARGIN = 12;
/** Used until the bubble has rendered once and can be measured. */
const BUBBLE_HEIGHT_ESTIMATE = 200;

/**
 * The first element matching `selector` that is actually on screen.
 *
 * Not simply `querySelector`: the dashboard sidebar is rendered twice -- a
 * mobile drawer parked off-canvas with a transform, and the desktop column --
 * so every sidebar anchor has a hidden twin that comes first in the document.
 * Taking the first match aimed the tour 256px off the left edge and it drew
 * nothing at all. Zero-sized matches (display:none, a pane behind a closed
 * tab) are skipped for the same reason.
 */
export function findVisibleTarget(selector: string): HTMLElement | null {
  for (const element of document.querySelectorAll<HTMLElement>(selector)) {
    const box = element.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) continue;
    if (box.right <= 0 || box.left >= window.innerWidth) continue;
    if (getComputedStyle(element).visibility === "hidden") continue;
    return element;
  }
  return null;
}

function readRect(selector: string): Rect | null {
  const element = findVisibleTarget(selector);
  if (!element) return null;
  const box = element.getBoundingClientRect();
  return { top: box.top, left: box.left, width: box.width, height: box.height };
}

/** Consecutive failed measurements (at 250ms apiece) before a step is skipped. */
const MISSES_BEFORE_SKIP = 3;

export function SpotlightTour({
  steps,
  open,
  onClose,
}: {
  steps: TourStep[];
  open: boolean;
  /** Called on finish, skip, or Escape. The tour never reopens itself. */
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [bubbleHeight, setBubbleHeight] = useState(BUBBLE_HEIGHT_ESTIMATE);
  const reduceMotion = useReducedMotion();

  // A callback ref rather than an effect: the bubble remounts per step inside
  // AnimatePresence, so an effect keyed on the index can fire while the ref
  // still holds the outgoing node. Attaching here measures and focuses the
  // node that is actually on screen.
  const attachBubble = useCallback((node: HTMLDivElement | null) => {
    bubbleRef.current = node;
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;

    // Real height, not a guess: body copy wraps differently per step and per
    // viewport, and placement decisions depend on whether it fits.
    const observer = new ResizeObserver(() => setBubbleHeight(node.offsetHeight));
    observer.observe(node);
    observerRef.current = observer;

    // Focus moves with the highlight so keyboard users are carried along.
    node.focus();
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  const step = steps[index];

  // Keeps the hole glued to its target through scrolling, resizing, and any
  // layout settling that happens after the step changes.
  useEffect(() => {
    if (!open || !step) return;

    let frame = 0;
    let misses = 0;
    const measure = () => {
      const next = readRect(step.target);
      if (next) {
        misses = 0;
        setRect(next);
        return;
      }
      // A target can vanish mid-tour (a resize across a breakpoint, a pane
      // closing). Rendering nothing would strand the user behind an invisible
      // tour with no way to advance, so a step that stays unresolvable is
      // skipped -- and the tour closes if it was the last one.
      misses += 1;
      if (misses < MISSES_BEFORE_SKIP) return;
      misses = 0;
      if (index + 1 < steps.length) setIndex(index + 1);
      else onClose();
    };

    const element = findVisibleTarget(step.target);
    element?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    });

    frame = requestAnimationFrame(measure);
    const interval = window.setInterval(measure, 250);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(interval);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step, index, steps.length, onClose, reduceMotion]);

  const finish = useCallback(() => {
    setIndex(0);
    onClose();
  }, [onClose]);

  const next = useCallback(() => {
    // Decided from the current index rather than inside a setState updater:
    // updaters must be pure, and StrictMode runs them twice, which would fire
    // onClose -- and its network write -- twice on the final step.
    if (index + 1 >= steps.length) {
      setIndex(0);
      onClose();
      return;
    }
    setIndex(index + 1);
  }, [index, onClose, steps.length]);

  const back = useCallback(() => {
    setIndex((current) => Math.max(0, current - 1));
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        back();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, finish, next, back]);

  if (!open || !step || !rect) return null;

  const hole = {
    top: rect.top - HOLE_PADDING,
    left: rect.left - HOLE_PADDING,
    width: rect.width + HOLE_PADDING * 2,
    height: rect.height + HOLE_PADDING * 2,
  };

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const bubbleWidth = Math.min(BUBBLE_WIDTH, viewportWidth - VIEWPORT_MARGIN * 2);
  const holeRight = hole.left + hole.width;
  const holeBottom = hole.top + hole.height;
  const centerX = hole.left + hole.width / 2;
  const centerY = hole.top + hole.height / 2;

  // Which sides have room for the whole bubble. Only checking above/below broke
  // on tall targets: the sidebar nav fills most of the viewport, so neither
  // fitted and the bubble was pushed off the top of the screen.
  const room: Record<Side, boolean> = {
    bottom: viewportHeight - holeBottom - BUBBLE_GAP - VIEWPORT_MARGIN >= bubbleHeight,
    top: hole.top - BUBBLE_GAP - VIEWPORT_MARGIN >= bubbleHeight,
    right: viewportWidth - holeRight - BUBBLE_GAP - VIEWPORT_MARGIN >= bubbleWidth,
    left: hole.left - BUBBLE_GAP - VIEWPORT_MARGIN >= bubbleWidth,
  };
  const preference: Side[] = ["bottom", "top", "right", "left"];
  if (step.placement) preference.unshift(step.placement);
  // "pinned" is the last resort, when a target is too large to sit beside on
  // any side (a big panel on a phone): the bubble docks at the foot of the
  // screen instead, so it is always reachable even if it covers the target.
  const side: Side | "pinned" = preference.find((candidate) => room[candidate]) ?? "pinned";

  const horizontalLeft = clamp(
    centerX - bubbleWidth / 2,
    VIEWPORT_MARGIN,
    viewportWidth - bubbleWidth - VIEWPORT_MARGIN,
  );
  const verticalTop = clamp(
    centerY - bubbleHeight / 2,
    VIEWPORT_MARGIN,
    viewportHeight - bubbleHeight - VIEWPORT_MARGIN,
  );

  const position =
    side === "bottom"
      ? { left: horizontalLeft, top: holeBottom + BUBBLE_GAP }
      : side === "top"
        ? { left: horizontalLeft, top: hole.top - BUBBLE_GAP - bubbleHeight }
        : side === "right"
          ? { left: holeRight + BUBBLE_GAP, top: verticalTop }
          : side === "left"
            ? { left: hole.left - BUBBLE_GAP - bubbleWidth, top: verticalTop }
            : {
                left: horizontalLeft,
                top: viewportHeight - bubbleHeight - VIEWPORT_MARGIN,
              };

  // Final guard: whatever was chosen, the bubble never leaves the viewport.
  const bubbleLeft = clamp(position.left, VIEWPORT_MARGIN, viewportWidth - bubbleWidth - VIEWPORT_MARGIN);
  const bubbleTop = clamp(position.top, VIEWPORT_MARGIN, viewportHeight - bubbleHeight - VIEWPORT_MARGIN);

  const enterOffset =
    side === "bottom" ? { y: -6 } : side === "top" ? { y: 6 } : side === "right" ? { x: -6 } : side === "left" ? { x: 6 } : { y: 6 };

  const isLast = index === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100]" role="presentation">
      {/* Swallows clicks on the page beneath so the tour cannot be interacted
          around, while the dimming itself comes from the hole's box-shadow. */}
      <div className="absolute inset-0" onClick={finish} />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-xl ring-2 ring-primary/70"
        initial={false}
        animate={{
          top: hole.top,
          left: hole.left,
          width: hole.width,
          height: hole.height,
        }}
        transition={
          reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30 }
        }
        style={{ boxShadow: "0 0 0 9999px rgba(9, 11, 20, 0.62)" }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          ref={attachBubble}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-title"
          aria-describedby="tour-body"
          tabIndex={-1}
          initial={reduceMotion ? false : { opacity: 0, ...enterOffset }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="absolute rounded-xl border border-border bg-card p-4 shadow-2xl outline-none"
          style={{ width: bubbleWidth, left: bubbleLeft, top: bubbleTop }}
        >
          {/* Arrow, pointing back at the highlighted element. Omitted when the
              bubble is pinned, since it is then not beside the target at all. */}
          {side !== "pinned" && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute h-3 w-3 rotate-45 border border-border bg-card",
                side === "bottom" && "-top-1.5 border-b-0 border-r-0",
                side === "top" && "-bottom-1.5 border-l-0 border-t-0",
                side === "right" && "-left-1.5 border-r-0 border-t-0",
                side === "left" && "-right-1.5 border-b-0 border-l-0",
              )}
              style={
                side === "bottom" || side === "top"
                  ? { left: clamp(centerX - bubbleLeft - 6, 16, bubbleWidth - 28) }
                  : { top: clamp(centerY - bubbleTop - 6, 16, bubbleHeight - 28) }
              }
            />
          )}

          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium text-muted-foreground">
              Step {index + 1} of {steps.length}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={finish}
              aria-label="Skip the tour"
            >
              <X aria-hidden="true" />
            </Button>
          </div>

          <h2 id="tour-title" className="mt-1 text-sm font-semibold text-foreground">
            {step.title}
          </h2>
          <p id="tour-body" className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {step.body}
          </p>

          <div className="mt-4 flex items-center justify-between gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={finish}>
              Skip
            </Button>
            <div className="flex items-center gap-2">
              {index > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={back}>
                  Back
                </Button>
              )}
              <Button type="button" size="sm" onClick={isLast ? finish : next}>
                {isLast ? "Got it" : "Next"}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
