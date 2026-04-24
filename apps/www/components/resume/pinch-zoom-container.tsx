"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode, TouchEvent } from "react";
import { cn } from "@/lib/utils";

type Point = {
  x: number;
  y: number;
};

type TouchLike = {
  clientX: number;
  clientY: number;
};

type GestureState =
  | {
      mode: "none";
    }
  | {
      mode: "pan";
      startTouch: Point;
      startOffset: Point;
    }
  | {
      mode: "pinch";
      startScale: number;
      startDistance: number;
      startMidpoint: Point;
      startOffset: Point;
    };

const MIN_SCALE = 1;
const MAX_SCALE = 4;

function getTouchPoint(touch: TouchLike): Point {
  return { x: touch.clientX, y: touch.clientY };
}

function getDistance(a: TouchLike, b: TouchLike) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function getMidpoint(a: TouchLike, b: TouchLike): Point {
  return {
    x: (a.clientX + b.clientX) / 2,
    y: (a.clientY + b.clientY) / 2,
  };
}

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

interface PinchZoomContainerProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function PinchZoomContainer({
  children,
  className,
  contentClassName,
}: PinchZoomContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<GestureState>({ mode: "none" });

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);

  const clampOffset = useCallback((next: Point, nextScale: number): Point => {
    const container = containerRef.current;
    const content = contentRef.current;

    if (!container || !content) return next;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const contentWidth = content.scrollWidth;
    const contentHeight = content.scrollHeight;

    const scaledWidth = contentWidth * nextScale;
    const scaledHeight = contentHeight * nextScale;

    let minX: number;
    let maxX: number;
    let minY: number;
    let maxY: number;

    if (scaledWidth <= containerWidth) {
      minX = (containerWidth - scaledWidth) / 2;
      maxX = minX;
    } else {
      minX = containerWidth - scaledWidth;
      maxX = 0;
    }

    if (scaledHeight <= containerHeight) {
      minY = (containerHeight - scaledHeight) / 2;
      maxY = minY;
    } else {
      minY = containerHeight - scaledHeight;
      maxY = 0;
    }

    return {
      x: Math.min(maxX, Math.max(minX, next.x)),
      y: Math.min(maxY, Math.max(minY, next.y)),
    };
  }, []);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();

    if (e.touches.length === 2) {
      const touchA = e.touches[0];
      const touchB = e.touches[1];
      gestureRef.current = {
        mode: "pinch",
        startScale: scale,
        startDistance: getDistance(touchA, touchB),
        startMidpoint: getMidpoint(touchA, touchB),
        startOffset: offset,
      };
      setIsInteracting(true);
      return;
    }

    if (e.touches.length === 1) {
      gestureRef.current = {
        mode: "pan",
        startTouch: getTouchPoint(e.touches[0]),
        startOffset: offset,
      };
      setIsInteracting(true);
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;

    if (gesture.mode === "pinch" && e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();

      const touchA = e.touches[0];
      const touchB = e.touches[1];
      const currentDistance = getDistance(touchA, touchB);
      const currentMidpoint = getMidpoint(touchA, touchB);

      const nextScale = clampScale(
        gesture.startScale * (currentDistance / gesture.startDistance),
      );

      const anchorX =
        (gesture.startMidpoint.x - gesture.startOffset.x) / gesture.startScale;
      const anchorY =
        (gesture.startMidpoint.y - gesture.startOffset.y) / gesture.startScale;

      const rawOffset = {
        x: currentMidpoint.x - anchorX * nextScale,
        y: currentMidpoint.y - anchorY * nextScale,
      };

      setScale(nextScale);
      setOffset(clampOffset(rawOffset, nextScale));
      return;
    }

    if (gesture.mode === "pan" && e.touches.length === 1) {
      e.preventDefault();
      e.stopPropagation();
      const currentTouch = getTouchPoint(e.touches[0]);
      const rawOffset = {
        x: gesture.startOffset.x + (currentTouch.x - gesture.startTouch.x),
        y: gesture.startOffset.y + (currentTouch.y - gesture.startTouch.y),
      };

      setOffset(clampOffset(rawOffset, scale));
    }
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();

    if (e.touches.length === 1) {
      gestureRef.current = {
        mode: "pan",
        startTouch: getTouchPoint(e.touches[0]),
        startOffset: offset,
      };
      setIsInteracting(true);
      return;
    }

    gestureRef.current = { mode: "none" };
    setIsInteracting(false);
    setOffset((prev) => clampOffset(prev, scale));
  };

  useEffect(() => {
    const handleResize = () => {
      setOffset((prev) => clampOffset(prev, scale));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampOffset, scale]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full overflow-hidden touch-none select-none",
        className,
      )}
      style={{ touchAction: "none" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        ref={contentRef}
        className={cn("origin-top-left will-change-transform", contentClassName)}
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
          transition: isInteracting ? "none" : "transform 120ms ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
