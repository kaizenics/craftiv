import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// A real SQLite file with every migration applied: the dispatcher is mostly
// claims and writes, so a mocked database would prove nothing about it.
process.env.TURSO_DATABASE_URL = `file:${join(mkdtempSync(join(tmpdir(), "craftiv-runner-")), "runner.db")}`;

type Db = typeof import("@/db").db;
let db: Db;
let schema: typeof import("@/db/schema");
let dispatchDueHunts: typeof import("./runner").dispatchDueHunts;

const NOW = new Date("2026-10-30T06:00:00Z");

beforeAll(async () => {
  ({ db } = await import("@/db"));
  for (const file of readdirSync("db/migrations").filter((f) => f.endsWith(".sql")).sort()) {
    await db.$client.executeMultiple(readFileSync(join("db/migrations", file), "utf-8"));
  }
  schema = await import("@/db/schema");
  ({ dispatchDueHunts } = await import("./runner"));
});

let remotiveCalls = 0;

/** Stubs Remotive with one job per query, answering after `delayMs`. */
function stubRemotive(delayMs = 0) {
  remotiveCalls = 0;
  vi.stubGlobal("fetch", async (input: string | URL | Request) => {
    const url = new URL(String(input));
    if (url.hostname !== "remotive.com") throw new Error(`unexpected fetch: ${url}`);
    remotiveCalls += 1;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    const query = url.searchParams.get("search") ?? "";
    return Response.json({
      jobs: [{ id: `job-${query}`, url: `https://remotive.com/${query}`, title: `${query} role`, description: "TypeScript and React" }],
    });
  });
}

let seq = 0;

/** One user with a resume and a due daily hunt for `query`. */
async function seedHunt(query: string) {
  const id = `u${++seq}`;
  await db.insert(schema.users).values({ id, name: id, email: `${id}@example.com` });
  await db.insert(schema.resumes).values({
    id: `${id}-resume`,
    userId: id,
    title: "Resume",
    templateId: "harvard",
    data: { contact: { firstName: "A" }, skills: [{ name: "TypeScript" }] } as never,
  });
  await db.insert(schema.jobHunts).values({
    id: `${id}-hunt`,
    userId: id,
    name: "Hunt",
    query,
    sources: ["remotive"],
    resumeId: `${id}-resume`,
    nextRunAt: new Date(NOW.getTime() - 60_000),
    emailDigest: false,
  });
}

beforeEach(async () => {
  await db.delete(schema.jobHunts);
  await db.delete(schema.users);
});

afterEach(() => vi.unstubAllGlobals());

describe("dispatchDueHunts", () => {
  it("asks Remotive once per distinct search in a tick, however many hunts share it", async () => {
    stubRemotive();
    for (let i = 0; i < 3; i++) await seedHunt("designer");

    const result = await dispatchDueHunts({ now: NOW, limit: 10 });

    expect(result.succeeded).toBe(3);
    expect(remotiveCalls).toBe(1);
  });

  it("finishes a batch of slow hunts within one tick's budget", async () => {
    // 10 hunts at ~300ms each: about 3s one after another, well past the 1.5s budget.
    stubRemotive(300);
    for (let i = 0; i < 10; i++) await seedHunt(`role-${i}`);

    const result = await dispatchDueHunts({ now: NOW, limit: 10, budgetMs: 1_500 });

    expect(result.succeeded).toBe(10);
    expect(result.budgetExhausted).toBe(false);
  });
});
