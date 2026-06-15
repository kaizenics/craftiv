import assert from "node:assert/strict";
import { test } from "vitest";

import { createArrayHandlers } from "@/lib/form-array";

interface Row {
  id: string;
  name: string;
}

function capture(data: Row[]) {
  let next: Row[] | null = null;
  const handlers = createArrayHandlers(data, (value) => {
    next = value;
  });
  return { handlers, get: () => next };
}

test("update replaces only the matching row's field", () => {
  const { handlers, get } = capture([
    { id: "a", name: "x" },
    { id: "b", name: "y" },
  ]);
  handlers.update("b", "name", "z");
  assert.deepEqual(get(), [
    { id: "a", name: "x" },
    { id: "b", name: "z" },
  ]);
});

test("remove drops the matching row", () => {
  const { handlers, get } = capture([
    { id: "a", name: "x" },
    { id: "b", name: "y" },
  ]);
  handlers.remove("a");
  assert.deepEqual(get(), [{ id: "b", name: "y" }]);
});

test("move swaps adjacent rows and ignores out-of-range moves", () => {
  const base = [
    { id: "a", name: "x" },
    { id: "b", name: "y" },
  ];

  const down = capture(base);
  down.handlers.move(0, "down");
  assert.deepEqual(down.get(), [
    { id: "b", name: "y" },
    { id: "a", name: "x" },
  ]);

  const oob = capture(base);
  oob.handlers.move(0, "up");
  assert.equal(oob.get(), null); // no onChange when the move is out of range
});
