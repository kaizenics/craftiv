import { and, asc, desc, eq, isNull, lt, or, sql, type SQL } from "drizzle-orm";

import type { Database } from "@/db";
import { atsBoards, atsJobs } from "@/db/schema";
import { ATS_BOARDS, type AtsBoard } from "./ats-boards-list";
import { atsFeedUrl, parseAtsFeed } from "./ats-parse";
import { CRAWLER_USER_AGENT } from "./http";
import { buildSourceKey, capDescription } from "./normalize";
import type { JobSearchQuery, JobSourceAdapter, NormalizedJob, UserJobInput } from "./types";
import type { JobProvenance } from "@/lib/types/job-hunter";
import { JobSourceError } from "./types";

/**
 * "Company job boards": the public Greenhouse, Lever and Ashby feeds of a
 * curated list of companies (ats-boards-list.ts).
 *
 * These APIs have no cross-company search, only one feed per company, and some
 * feeds are megabytes. So the network is kept out of hunts entirely: the cron
 * tick refreshes a few stale boards into a shared cache (ats_jobs), and search()
 * is a title match against that cache. Each board is fetched a few times a day
 * for the whole deployment, however many users hunt on it.
 */

/** How long a board's cached jobs count as fresh. */
export const ATS_REFRESH_HOURS = 6;
const REQUEST_TIMEOUT_MS = 20_000;
/** Newest first; a company with more open roles than this keeps its most recent. */
const MAX_JOBS_PER_BOARD = 300;
const INSERT_CHUNK = 50;

const boardKey = (board: AtsBoard) => `${board.provider}:${board.slug}`;

async function fetchBoard(board: AtsBoard): Promise<NormalizedJob[]> {
  let response: Response;
  try {
    response = await fetch(atsFeedUrl(board.provider, board.slug), {
      // Refused, not followed: a redirect is the one way a fixed URL could reach another host.
      redirect: "error",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { Accept: "application/json", "User-Agent": CRAWLER_USER_AGENT },
    });
  } catch (error) {
    throw new JobSourceError("ats_boards", "TRANSIENT", `${boardKey(board)}: ${error instanceof Error ? error.message : "request failed"}`);
  }
  if (response.status === 429) throw new JobSourceError("ats_boards", "RATE_LIMITED", `${boardKey(board)}: rate limited`);
  if (response.status === 404) throw new JobSourceError("ats_boards", "PERMANENT", `${boardKey(board)}: board not found`);
  if (!response.ok) throw new JobSourceError("ats_boards", "TRANSIENT", `${boardKey(board)}: HTTP ${response.status}`);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new JobSourceError("ats_boards", "TRANSIENT", `${boardKey(board)}: unreadable JSON`);
  }
  return parseAtsFeed(board.provider, board.slug, board.company, body)
    .sort((a, b) => (b.postedAt?.getTime() ?? 0) - (a.postedAt?.getTime() ?? 0))
    .slice(0, MAX_JOBS_PER_BOARD);
}

/** Swaps one board's cached jobs for a fresh set in one transaction, so a search never sees half a board. */
async function storeBoard(db: Database, key: string, jobs: NormalizedJob[], now: Date) {
  await db.transaction(async (tx) => {
    await tx.delete(atsJobs).where(eq(atsJobs.boardKey, key));
    const rows = jobs.map((job) => ({
      sourceKey: job.sourceKey,
      boardKey: key,
      externalId: job.externalId,
      title: job.title,
      company: job.company,
      location: job.location,
      employmentType: job.employmentType,
      salaryText: job.salaryText,
      url: job.url,
      description: job.description,
      descriptionTruncated: job.descriptionTruncated,
      postedAt: job.postedAt,
    }));
    for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
      // A board listing one posting twice must not abort the swap.
      await tx.insert(atsJobs).values(rows.slice(i, i + INSERT_CHUNK)).onConflictDoNothing();
    }
    await tx.update(atsBoards).set({ fetchedAt: now, jobCount: rows.length, error: null }).where(eq(atsBoards.boardKey, key));
  });
}

/**
 * Refreshes up to `maxBoards` stale boards, oldest first, in parallel (they are
 * on different companies' boards). A board is claimed by stamping attemptedAt
 * before the fetch, so two servers ticking together never fetch the same one,
 * and a failing board waits a full refresh period before it is tried again.
 */
export async function refreshAtsBoards(db: Database, options: { maxBoards?: number; now?: Date } = {}) {
  const now = options.now ?? new Date();
  const stale = new Date(now.getTime() - ATS_REFRESH_HOURS * 60 * 60 * 1000);

  // New boards get a row the first time; existing rows are left as they are.
  await db
    .insert(atsBoards)
    .values(ATS_BOARDS.map((board) => ({ boardKey: boardKey(board) })))
    .onConflictDoNothing();

  const due = await db
    .select({ boardKey: atsBoards.boardKey })
    .from(atsBoards)
    .where(or(isNull(atsBoards.attemptedAt), lt(atsBoards.attemptedAt, stale)))
    .orderBy(asc(atsBoards.attemptedAt))
    .limit(options.maxBoards ?? 3);

  const byKey = new Map(ATS_BOARDS.map((board) => [boardKey(board), board]));
  // Claim first, one at a time: a board another server already claimed is skipped.
  const claimed: AtsBoard[] = [];
  for (const { boardKey: key } of due) {
    const board = byKey.get(key);
    if (!board) continue; // Dropped from the list; its rows simply age out of searches.
    const won = await db
      .update(atsBoards)
      .set({ attemptedAt: now })
      .where(and(eq(atsBoards.boardKey, key), or(isNull(atsBoards.attemptedAt), lt(atsBoards.attemptedAt, stale))))
      .returning({ boardKey: atsBoards.boardKey });
    if (won.length) claimed.push(board);
  }

  // Fetch in parallel (the slow part, and on different companies' hosts), then
  // write one board at a time: SQLite takes one writer, so parallel write
  // transactions would fail each other with "database is locked".
  const fetched = await Promise.allSettled(claimed.map((board) => fetchBoard(board)));
  let refreshed = 0;
  let failed = 0;
  for (const [index, outcome] of fetched.entries()) {
    const key = boardKey(claimed[index]);
    try {
      if (outcome.status === "rejected") throw outcome.reason;
      await storeBoard(db, key, outcome.value, now);
      refreshed += 1;
    } catch (error) {
      failed += 1;
      await db
        .update(atsBoards)
        .set({ error: (error instanceof Error ? error.message : "refresh failed").slice(0, 300) })
        .where(eq(atsBoards.boardKey, key));
    }
  }
  return { refreshed, failed };
}

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
const contains = (column: typeof atsJobs.title | typeof atsJobs.location, value: string): SQL =>
  sql`${column} LIKE ${`%${escapeLike(value)}%`} ESCAPE '\\'`;
const REMOTE_ONLY = /^(remote|anywhere|worldwide|global)$/i;

export const atsBoardsAdapter: JobSourceAdapter = {
  id: "ats_boards",
  label: "Company job boards",

  capabilities: {
    pollable: true,
    identifiableFromUrl: false,
    fetchableOnDemand: false,
    crawlDelaySeconds: 1,
    attribution: null,
    restrictionNote: null,
  },

  /**
   * Every word of the query must appear in the job title (SQLite LIKE is
   * case-insensitive for ASCII). A location narrows to jobs naming it, and
   * remote roles always stay in, since they are open from anywhere.
   */
  async search(query: JobSearchQuery): Promise<NormalizedJob[]> {
    const { db } = await import("@/db");
    const words = query.query.toLowerCase().split(/\s+/).filter((word) => word.length >= 2).slice(0, 6);
    const location = query.location.trim();

    const conditions: SQL[] = words.map((word) => contains(atsJobs.title, word));
    if (location) {
      const remote = or(contains(atsJobs.location, "remote"), contains(atsJobs.location, "anywhere"));
      conditions.push(REMOTE_ONLY.test(location) ? remote! : or(contains(atsJobs.location, location), remote)!);
    }

    const rows = await db
      .select()
      .from(atsJobs)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(atsJobs.postedAt))
      .limit(Math.max(1, query.limit));

    return rows.map((row) => ({
      source: "ats_boards",
      externalId: row.externalId,
      sourceKey: row.sourceKey,
      provenance: "feed",
      title: row.title,
      company: row.company,
      location: row.location,
      employmentType: row.employmentType,
      salaryText: row.salaryText,
      hoursPerWeek: "",
      url: row.url,
      applyUrl: row.url,
      description: row.description,
      descriptionTruncated: row.descriptionTruncated,
      postedAt: row.postedAt,
      raw: null,
    }));
  },

  fromUserInput(input: UserJobInput, provenance: JobProvenance): NormalizedJob {
    // Board postings arrive through the cache; this satisfies the shared import path like Remotive's.
    const { description, descriptionTruncated } = capDescription(input.description ?? "");
    const externalId = input.url ?? String(Date.now());
    return {
      source: "ats_boards",
      externalId,
      sourceKey: buildSourceKey("ats_boards", externalId),
      provenance,
      title: input.title?.trim() || "Untitled role",
      company: input.company?.trim() ?? "",
      location: input.location?.trim() ?? "",
      employmentType: "",
      salaryText: "",
      hoursPerWeek: "",
      url: input.url ?? "",
      applyUrl: input.url ?? "",
      description,
      descriptionTruncated,
      postedAt: null,
      raw: null,
    };
  },
};
