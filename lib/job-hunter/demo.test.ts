import assert from "node:assert/strict";
import { test } from "vitest";

import { buildDemoHunts, buildDemoMatches, isDemoId } from "@/lib/job-hunter/demo";

const NOW = new Date("2026-09-11T12:00:00Z");

test("every sample id is caught by the guard, so none can reach the API", () => {
  const matches = buildDemoMatches(NOW);
  const hunts = buildDemoHunts(NOW);
  const ids = [
    ...matches.map((match) => match.id),
    ...matches.map((match) => match.posting.id),
    ...matches.map((match) => match.resumeId),
    ...hunts.map((hunt) => hunt.id),
  ];

  for (const id of ids) assert.ok(isDemoId(id), `unguarded sample id: ${id}`);
  assert.equal(new Set(matches.map((match) => match.id)).size, matches.length, "ids must be unique");
});

test("the guard does not catch real ids", () => {
  for (const id of ["abc123", "", null, undefined, "d-emo", "xdemo-1"]) {
    assert.equal(isDemoId(id), false, `false positive on ${String(id)}`);
  }
});

test("samples span several pipeline stages and every score band", () => {
  const matches = buildDemoMatches(NOW);

  // The board and the status tabs only demonstrate tracking if more than one
  // column has something in it.
  assert.ok(new Set(matches.map((match) => match.applicationStatus)).size >= 3);

  const scores = matches.map((match) => match.score);
  assert.ok(scores.some((score) => score >= 80), "no strong match");
  assert.ok(scores.some((score) => score >= 60 && score < 80), "no middling match");
  assert.ok(scores.some((score) => score < 60), "no weak match");
});

test("no sample links anywhere real", () => {
  for (const match of buildDemoMatches(NOW)) {
    assert.equal(match.posting.url, "");
    assert.equal(match.posting.applyUrl, "");
  }
});

test("samples are dated relative to the supplied clock", () => {
  for (const match of buildDemoMatches(NOW)) {
    assert.ok(new Date(match.createdAt).getTime() <= NOW.getTime());
  }
  const [hunt] = buildDemoHunts(NOW);
  assert.ok(hunt && new Date(hunt.nextRunAt!).getTime() > NOW.getTime());
});
