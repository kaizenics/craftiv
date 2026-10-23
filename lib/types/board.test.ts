import assert from "node:assert/strict";
import { test } from "vitest";

import { autoPlace, BOARD_TEMPLATES, defaultStatusFrames, positionBetween, statusFrameAt } from "@/lib/types/board";

test("statusFrameAt finds the frame under a point and prefers the smaller of overlapping frames", () => {
  const frames = [
    { status: "saved" as const, x: 0, y: 0, w: 300, h: 600 },
    { status: "applied" as const, x: 100, y: 100, w: 100, h: 100 },
    { x: 0, y: 0, w: 2000, h: 2000 }, // custom frame: never sets a status
  ];
  assert.equal(statusFrameAt({ x: 50, y: 50 }, frames), "saved");
  assert.equal(statusFrameAt({ x: 150, y: 150 }, frames), "applied");
  assert.equal(statusFrameAt({ x: 1500, y: 1500 }, frames), null);
});

test("defaultStatusFrames lays every status out in a row and autoPlace stacks inside one", () => {
  const frames = defaultStatusFrames();
  assert.equal(frames.length, 8);
  assert.ok(frames[1].x! > frames[0].x! + frames[0].w!);
  const first = autoPlace(frames[0], 0);
  const second = autoPlace(frames[0], 140);
  assert.equal(statusFrameAt(first, frames), "saved");
  assert.ok(second.y > first.y);
});

test("positionBetween orders a drop between, above or below its neighbours", () => {
  assert.equal(positionBetween(1, 2), 1.5);
  assert.equal(positionBetween(undefined, 1), 0);
  assert.equal(positionBetween(3, undefined), 4);
  assert.equal(positionBetween(), 1);
});

test("every board template places all eight status frames without overlaps, and its notes inside its frames", () => {
  const overlap = (a: { x: number; y: number; w: number; h: number }, b: typeof a) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  for (const template of BOARD_TEMPLATES) {
    const boxes = Object.values(template.frames);
    assert.equal(boxes.length, 8, template.id);
    const frames = [...boxes, ...template.extras.filter((e) => e.kind === "frame").map((e) => e.data as { x: number; y: number; w: number; h: number })];
    frames.forEach((a, i) => frames.slice(i + 1).forEach((b) => assert.equal(overlap(a, b), false, `${template.id} frames overlap`)));
    for (const note of template.extras.filter((e) => e.kind === "note")) {
      const n = note.data as { x: number; y: number; w: number; h: number };
      assert.ok(frames.some((f) => n.x >= f.x && n.x + n.w <= f.x + f.w && n.y >= f.y && n.y + n.h <= f.y + f.h), `${template.id} note outside frames`);
    }
  }
});
