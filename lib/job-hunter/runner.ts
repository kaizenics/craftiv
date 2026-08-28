import { randomUUID } from "node:crypto";
import { and, asc, eq, isNotNull, isNull, lte, ne } from "drizzle-orm";

import { db as defaultDb, type Database } from "@/db";
import { huntRuns, jobHunts, jobMatches, jobPostings, resumes, users } from "@/db/schema";
import { isUniqueConstraintError } from "@/lib/db-errors";
import { hashForLogs, securityLog } from "@/lib/security/logging";
import { sendJobDigestEmail } from "@/lib/email";
import { getAdapter, isPollableSource } from "@/lib/job-sources";
import { hashJobContent, type NormalizedJob } from "@/lib/job-sources";
import { STALE_POSTING_DAYS, type JobSourceId } from "@/lib/types/job-hunter";
import { scoreResumeAgainstJob } from "./scoring";
import {
  computeNextRunAt,
  manualRunKey,
  runKeyFor,
  RUN_LEASE_MS,
  type HuntFrequency,
} from "./schedule";
import { buildJobDigestEmail, type DigestJob, type DigestMovedJob } from "./digest";

/**
 * The hunt runner: the first background worker in this codebase.
 *
 * Two properties matter more than anything else here.
 *
 * Claiming is an INSERT against the unique index on (hunt_id, run_key), not a
 * lock. Turso has no SELECT ... FOR UPDATE, so the database arbitrates: two
 * overlapping ticks both try to insert, exactly one wins, the loser sees a
 * unique violation and skips. That is the same idiom consumeCredits uses for
 * idempotencyKey, and it stays correct if the container is ever scaled past one
 * replica.
 *
 * Nothing here charges credits. Ingestion is a feed read and scoring is the
 * deterministic engine in lib/ats.ts, so a scheduled run costs the user nothing
 * -- which is what makes it safe to run unattended. A user who is not present
 * cannot answer an INSUFFICIENT_CREDITS error, and silently draining a balance
 * in the background is the kind of thing people close accounts over. Tailoring,
 * the one paid action, stays in the foreground where the user asks for it.
 */

/** Jobs pulled from a feed per run. */
const MAX_JOBS_PER_RUN = 25;
/** Matches re-scored per run after a resume edit. */
const MAX_RESCORES_PER_RUN = 100;

export type RunHuntResult = {
  huntId: string;
  claimed: boolean;
  status: "succeeded" | "failed" | "skipped";
  jobsFetched: number;
  jobsNew: number;
  jobsScored: number;
  matchesRescored: number;
  jobsArchived: number;
  digestSent: boolean;
  error?: string;
};

type HuntRow = typeof jobHunts.$inferSelect;

/**
 * Claims a hunt for this tick, or returns null if someone else already has it.
 *
 * A run whose lease has expired is retaken: the worker holding it died, and
 * without this the hunt would never run again.
 */
async function claimHunt(
  db: Database,
  hunt: HuntRow,
  now: Date,
  trigger: "schedule" | "manual",
): Promise<{ id: string } | null> {
  const runKey =
    trigger === "manual"
      ? manualRunKey(randomUUID())
      : runKeyFor(hunt.frequency as HuntFrequency, now);

  const row = {
    id: randomUUID(),
    huntId: hunt.id,
    userId: hunt.userId,
    runKey,
    status: "claimed" as const,
    trigger,
    lockExpiresAt: new Date(now.getTime() + RUN_LEASE_MS),
    startedAt: now,
  };

  try {
    await db.insert(huntRuns).values(row);
    return { id: row.id };
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;

    // Someone holds this bucket. Retake it only if their lease has expired.
    const existing = await db.query.huntRuns.findFirst({
      where: and(eq(huntRuns.huntId, hunt.id), eq(huntRuns.runKey, runKey)),
      columns: { id: true, status: true, lockExpiresAt: true },
    });

    if (!existing || existing.status !== "claimed" || existing.lockExpiresAt > now) {
      return null;
    }

    // Compare-and-swap: the where clause carries the state we read, so a racing
    // worker that got there first makes this affect zero rows.
    const retaken = await db
      .update(huntRuns)
      .set({ lockExpiresAt: new Date(now.getTime() + RUN_LEASE_MS), startedAt: now })
      .where(
        and(
          eq(huntRuns.id, existing.id),
          eq(huntRuns.status, "claimed"),
          lte(huntRuns.lockExpiresAt, now),
        ),
      );

    return retaken.rowsAffected === 1 ? { id: existing.id } : null;
  }
}

/** Inserts a posting for a user, or returns the row they already have. */
async function upsertPosting(
  db: Database,
  userId: string,
  job: NormalizedJob,
): Promise<{ id: string; created: boolean }> {
  const now = new Date();
  const id = randomUUID();

  try {
    await db.insert(jobPostings).values({
      id,
      userId,
      source: job.source,
      externalId: job.externalId,
      sourceKey: job.sourceKey,
      contentHash: hashJobContent({
        title: job.title,
        company: job.company,
        description: job.description,
      }),
      provenance: job.provenance,
      title: job.title,
      company: job.company,
      location: job.location,
      employmentType: job.employmentType,
      salaryText: job.salaryText,
      url: job.url,
      applyUrl: job.applyUrl,
      description: job.description,
      descriptionTruncated: job.descriptionTruncated,
      postedAt: job.postedAt,
      raw: job.raw,
      createdAt: now,
      updatedAt: now,
    });
    return { id, created: true };
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;

    const existing = await db.query.jobPostings.findFirst({
      where: and(eq(jobPostings.userId, userId), eq(jobPostings.sourceKey, job.sourceKey)),
      columns: { id: true },
    });
    if (!existing) throw error;
    return { id: existing.id, created: false };
  }
}

export async function runHunt(params: {
  db?: Database;
  hunt: HuntRow;
  now?: Date;
  trigger?: "schedule" | "manual";
}): Promise<RunHuntResult> {
  const db = params.db ?? defaultDb;
  const now = params.now ?? new Date();
  const trigger = params.trigger ?? "schedule";
  const hunt = params.hunt;

  const base: RunHuntResult = {
    huntId: hunt.id,
    claimed: false,
    status: "skipped",
    jobsFetched: 0,
    jobsNew: 0,
    jobsScored: 0,
    matchesRescored: 0,
    jobsArchived: 0,
    digestSent: false,
  };

  const claim = await claimHunt(db, hunt, now, trigger);
  if (!claim) return base;

  // Advance the schedule at the start of the run, not the end. A hunt that
  // fails must not spin on the same slot until someone notices.
  const nextRunAt = computeNextRunAt({
    frequency: hunt.frequency as HuntFrequency,
    runAtMinuteUtc: hunt.runAtMinuteUtc,
    from: now,
  });
  await db
    .update(jobHunts)
    .set({ lastRunAt: now, nextRunAt, updatedAt: now })
    .where(eq(jobHunts.id, hunt.id));

  const result: RunHuntResult = { ...base, claimed: true };
  let problem: string | null = null;
  const newJobs: DigestJob[] = [];
  const movedJobs: DigestMovedJob[] = [];

  try {
    const resume = hunt.resumeId
      ? await db.query.resumes.findFirst({
          where: and(eq(resumes.id, hunt.resumeId), eq(resumes.userId, hunt.userId)),
        })
      : null;

    if (!resume?.data) {
      // Deleting the resume must not silently stop the hunt: say so in the
      // digest rather than failing quietly every night.
      problem =
        "This hunt has no resume to score against. Pick one in Job Hunter to start matching again.";
    } else {
      // 1. Ingest from every pollable source the hunt asked for.
      for (const sourceId of (hunt.sources ?? []) as JobSourceId[]) {
        if (!isPollableSource(sourceId)) continue; // The ladder's enforcement point.

        const adapter = getAdapter(sourceId);
        if (!adapter.search) continue;

        try {
          const jobs = await adapter.search(
            { query: hunt.query, location: hunt.location, limit: MAX_JOBS_PER_RUN },
            AbortSignal.timeout(30_000),
          );
          result.jobsFetched += jobs.length;

          for (const job of jobs) {
            const posting = await upsertPosting(db, hunt.userId, job);
            if (!posting.created) continue;
            result.jobsNew += 1;

            const scored = scoreResumeAgainstJob(resume.data, job.description);
            const minScore = hunt.filters?.minScore ?? 0;
            if (scored.score < minScore) continue;

            await db.insert(jobMatches).values({
              id: randomUUID(),
              userId: hunt.userId,
              jobPostingId: posting.id,
              resumeId: resume.id,
              huntId: hunt.id,
              score: scored.score,
              scoringVersion: scored.scoringVersion,
              report: scored.report,
              scoredAt: now,
              resumeVersionAt: resume.updatedAt,
              pipelineStatus: "scored",
              applicationStatus: "new",
              createdAt: now,
              updatedAt: now,
            });

            result.jobsScored += 1;
            newJobs.push({
              title: job.title,
              company: job.company,
              score: scored.score,
              url: job.url,
            });
          }
        } catch (error) {
          // One source failing must not lose the rest of the run.
          securityLog(
            "job_hunter_source_failed",
            {
              huntId: hashForLogs(hunt.id),
              source: sourceId,
              message: error instanceof Error ? error.message : "unknown",
            },
            "warn",
          );
        }
      }

      // 2. Re-score matches whose resume has changed since they were scored.
      //    This is the automation that works with no external source at all,
      //    and it is why a scheduled run is worth having for a user whose jobs
      //    are all hand-pasted.
      const stale = await db.query.jobMatches.findMany({
        where: and(
          eq(jobMatches.userId, hunt.userId),
          eq(jobMatches.resumeId, resume.id),
          ne(jobMatches.applicationStatus, "dismissed"),
        ),
        limit: MAX_RESCORES_PER_RUN,
        with: { posting: { columns: { title: true, company: true, description: true } } },
      });

      for (const match of stale) {
        const changed =
          Math.floor(resume.updatedAt.getTime() / 1000) >
          Math.floor(match.resumeVersionAt.getTime() / 1000);
        if (!changed || !match.posting?.description) continue;

        const scored = scoreResumeAgainstJob(resume.data, match.posting.description);
        await db
          .update(jobMatches)
          .set({
            score: scored.score,
            scoringVersion: scored.scoringVersion,
            report: scored.report,
            scoredAt: now,
            resumeVersionAt: resume.updatedAt,
            updatedAt: now,
          })
          .where(eq(jobMatches.id, match.id));

        result.matchesRescored += 1;
        if (scored.score !== match.score) {
          movedJobs.push({
            title: match.posting.title,
            company: match.posting.company,
            beforeScore: match.score,
            afterScore: scored.score,
          });
        }
      }
    }

    // 3. Staleness sweep, from posting age alone. We never fetch a source to
    //    confirm a posting closed -- that would be a request per saved job.
    const cutoff = new Date(now.getTime() - STALE_POSTING_DAYS * 86_400_000);
    const aged = await db.query.jobPostings.findMany({
      where: and(
        eq(jobPostings.userId, hunt.userId),
        lte(jobPostings.createdAt, cutoff),
        isNull(jobPostings.archivedAt),
      ),
      columns: { id: true },
      limit: 200,
    });

    for (const posting of aged) {
      await db
        .update(jobPostings)
        .set({ archivedAt: now, updatedAt: now })
        .where(eq(jobPostings.id, posting.id));
      result.jobsArchived += 1;
    }

    // 4. Digest. Only when there is something to say -- an empty digest trains
    //    people to ignore the next one and risks the sending domain.
    if (hunt.emailDigest) {
      const built = buildJobDigestEmail({
        huntName: hunt.name,
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://craftiv.app",
        newJobs,
        movedJobs,
        staleCount: result.jobsArchived,
        problem,
      });

      if (built) {
        const owner = await db.query.users.findFirst({
          where: eq(users.id, hunt.userId),
          columns: { email: true },
        });

        if (owner?.email) {
          // Flip the flag before sending, and only if it is still false, so a
          // retaken run cannot send the same digest twice.
          const marked = await db
            .update(huntRuns)
            .set({ digestSent: true })
            .where(and(eq(huntRuns.id, claim.id), eq(huntRuns.digestSent, false)));

          if (marked.rowsAffected === 1) {
            await sendJobDigestEmail({ email: owner.email, ...built });
            result.digestSent = true;
          }
        }
      }
    }

    await db
      .update(huntRuns)
      .set({
        status: "succeeded",
        finishedAt: new Date(),
        jobsFetched: result.jobsFetched,
        jobsNew: result.jobsNew,
        jobsScored: result.jobsScored,
        matchesRescored: result.matchesRescored,
        jobsArchived: result.jobsArchived,
        digestSent: result.digestSent,
      })
      .where(eq(huntRuns.id, claim.id));

    result.status = "succeeded";
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";

    await db
      .update(huntRuns)
      .set({ status: "failed", finishedAt: new Date(), errorMessage: message.slice(0, 500) })
      .where(eq(huntRuns.id, claim.id));

    securityLog(
      "job_hunter_run_failed",
      { huntId: hashForLogs(hunt.id), userIdHash: hashForLogs(hunt.userId), message },
      "warn",
    );

    return { ...result, status: "failed", error: message };
  }
}

export type DispatchResult = {
  claimed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  remaining: number;
  budgetExhausted: boolean;
};

/**
 * Drains a bounded batch of due hunts.
 *
 * The endpoint is a dispatcher, not a worker: it stops claiming once the
 * wall-clock budget is spent and reports what is left, so a deep queue drains
 * across ticks instead of holding one request open past the proxy timeout.
 */
export async function dispatchDueHunts(params: {
  db?: Database;
  now?: Date;
  limit?: number;
  budgetMs?: number;
}): Promise<DispatchResult> {
  const db = params.db ?? defaultDb;
  const now = params.now ?? new Date();
  const limit = params.limit ?? 5;
  const deadline = Date.now() + (params.budgetMs ?? 45_000);

  const due = await db.query.jobHunts.findMany({
    where: and(
      eq(jobHunts.isActive, true),
      ne(jobHunts.frequency, "manual"),
      isNotNull(jobHunts.nextRunAt),
      lte(jobHunts.nextRunAt, now),
    ),
    orderBy: [asc(jobHunts.nextRunAt)],
    limit: limit + 1,
  });

  const batch = due.slice(0, limit);
  const result: DispatchResult = {
    claimed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    remaining: Math.max(0, due.length - batch.length),
    budgetExhausted: false,
  };

  for (const hunt of batch) {
    if (Date.now() > deadline) {
      result.budgetExhausted = true;
      result.remaining += 1;
      continue;
    }

    const run = await runHunt({ db, hunt, now, trigger: "schedule" });
    if (!run.claimed) {
      result.skipped += 1;
      continue;
    }

    result.claimed += 1;
    if (run.status === "succeeded") result.succeeded += 1;
    else if (run.status === "failed") result.failed += 1;
  }

  return result;
}
