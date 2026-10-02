import { randomUUID } from "node:crypto";

import { z } from "zod";
import { and, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "../init";
import { coverLetters, huntRuns, jobHunts, jobMatches, jobPostings, resumes } from "@/db/schema";
import { isPollableSource } from "@/lib/job-sources";
import { computeNextRunAt } from "@/lib/job-hunter/schedule";
import { runHunt } from "@/lib/job-hunter/runner";
import { JOB_SOURCE_IDS } from "@/lib/types/job-hunter";
import {
  InsufficientCreditsError,
  JOB_TAILOR_COST,
  newChargeIdempotencyKey,
  refundCredits,
} from "@/lib/credits";
import type { AiConnection } from "@/lib/ai";
import { beginAiAction } from "@/lib/own-ai-access";
import { normalizeCoverLetterData } from "@/lib/types/cover-letter";
import { TailorError, tailorResumeForJob } from "@/lib/job-hunter/tailor";
import type { Database } from "@/db";
import { isUniqueConstraintError } from "@/lib/db-errors";
import { enforceRouteRateLimits } from "@/lib/security/guards";
import { PROMPT_INPUT_LIMITS } from "@/lib/constants/prompt-limits";
import { scoreResumeAgainstJob } from "@/lib/job-hunter/scoring";
import {
  hashJobContent,
  resolveAdapterForUrl,
  safeParseUrl,
  type NormalizedJob,
} from "@/lib/job-sources";
import { fetchOnlineJobsPosting, onlineJobsPhAdapter } from "@/lib/job-sources/onlinejobs-ph";
import { JobSourceError } from "@/lib/job-sources/types";
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  type JobProvenance,
} from "@/lib/types/job-hunter";
import type { ResumeDataJSON } from "@/db/schema/resumes";

/**
 * Job Hunter.
 *
 * Phase 1 is deliberately free: importing a job is deterministic parsing and
 * scoring is the deterministic engine in lib/ats.ts, so nothing here makes a
 * model call or charges credits. Tailoring, which does both, lands in phase 2.
 */

/** Mirrors getOwnedResume in trpc/routers/resume.ts. */
async function getOwnedResume(db: Database, resumeId: string, userId: string) {
  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, userId)),
  });

  if (!resume) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Resume not found" });
  }

  return resume;
}

async function getOwnedMatch(db: Database, matchId: string, userId: string) {
  const match = await db.query.jobMatches.findFirst({
    where: and(eq(jobMatches.id, matchId), eq(jobMatches.userId, userId)),
  });

  if (!match) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
  }

  return match;
}

/**
 * Inserts a posting, or returns the existing row when this user already has it.
 *
 * Turso has no SELECT ... FOR UPDATE, so the unique index on
 * (user_id, source_key) is the lock: insert, and treat a unique violation as
 * "already have it". The same idiom consumeCredits uses for idempotencyKey, and
 * it avoids a read-then-write race without a transaction.
 */
async function upsertPosting(
  db: Database,
  userId: string,
  job: NormalizedJob,
): Promise<{ id: string; deduped: boolean }> {
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
      hoursPerWeek: job.hoursPerWeek,
      url: job.url,
      applyUrl: job.applyUrl,
      description: job.description,
      descriptionTruncated: job.descriptionTruncated,
      postedAt: job.postedAt,
      raw: job.raw,
      createdAt: now,
      updatedAt: now,
    });

    return { id, deduped: false };
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;

    const existing = await db.query.jobPostings.findFirst({
      where: and(eq(jobPostings.userId, userId), eq(jobPostings.sourceKey, job.sourceKey)),
      columns: { id: true },
    });

    if (!existing) throw error;
    return { id: existing.id, deduped: true };
  }
}

/**
 * Scores a posting against a resume and writes the match.
 *
 * Free and deterministic. The unique index on (job_posting_id, resume_id) means
 * re-scoring updates in place rather than accumulating rows, and it deliberately
 * leaves `applicationStatus` alone -- that column is user-owned, and a re-score
 * must never move a job the user marked "interviewing" back to "new".
 */
async function scoreAndUpsertMatch(
  db: Database,
  params: {
    userId: string;
    postingId: string;
    resumeId: string;
    resumeData: ResumeDataJSON;
    resumeUpdatedAt: Date;
    jobDescription: string;
  },
) {
  const scored = scoreResumeAgainstJob(params.resumeData, params.jobDescription);
  const now = new Date();

  const existing = await db.query.jobMatches.findFirst({
    where: and(
      eq(jobMatches.jobPostingId, params.postingId),
      eq(jobMatches.resumeId, params.resumeId),
    ),
    columns: { id: true },
  });

  if (existing) {
    await db
      .update(jobMatches)
      .set({
        score: scored.score,
        scoringVersion: scored.scoringVersion,
        report: scored.report,
        scoredAt: now,
        resumeVersionAt: params.resumeUpdatedAt,
        pipelineStatus: "scored",
        updatedAt: now,
      })
      .where(eq(jobMatches.id, existing.id));

    return existing.id;
  }

  const id = randomUUID();
  await db.insert(jobMatches).values({
    id,
    userId: params.userId,
    jobPostingId: params.postingId,
    resumeId: params.resumeId,
    score: scored.score,
    scoringVersion: scored.scoringVersion,
    report: scored.report,
    scoredAt: now,
    resumeVersionAt: params.resumeUpdatedAt,
    pipelineStatus: "scored",
    applicationStatus: "new",
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

/**
 * Outbound scraping is heavier and more conspicuous than an ordinary mutation,
 * so it borrows the ai_heavy budget rather than the global one.
 */
async function enforceJobFetchRateLimit(
  ctx: { requestHeaders: { get(name: string): string | null }; user: { id: string } },
  mutation: string,
) {
  const result = await enforceRouteRateLimits({
    category: "ai_heavy",
    route: `/api/trpc/jobHunter.${mutation}`,
    requestHeaders: ctx.requestHeaders,
    userId: ctx.user.id,
  });

  if (!result.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Retry after ${result.retryAfterSeconds} second(s).`,
    });
  }
}

/** Maps a source error onto a tRPC code without leaking internals. */
function toTrpcError(error: unknown): TRPCError {
  if (error instanceof JobSourceError) {
    if (error.code === "RATE_LIMITED" || error.code === "AUTH") {
      // The source told us to stop. Surface that plainly rather than retrying.
      return new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message:
          "OnlineJobs.ph refused the request. Paste the job description instead, or try later.",
      });
    }
    return new TRPCError({ code: "BAD_REQUEST", message: error.message });
  }

  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not read that job." });
}

const importJobInput = z
  .object({
    resumeId: z.string().min(1),
    url: z.string().max(2048).optional(),
    description: z.string().max(PROMPT_INPUT_LIMITS.jobDescription).optional(),
    // Supplying these skips any need for a model call, which is what keeps the
    // import free.
    title: z.string().max(PROMPT_INPUT_LIMITS.targetRole).optional(),
    company: z.string().max(PROMPT_INPUT_LIMITS.name).optional(),
    location: z.string().max(PROMPT_INPUT_LIMITS.name).optional(),
  })
  .refine((value) => Boolean(value.url?.trim() || value.description?.trim()), {
    message: "Paste the job description or a job URL.",
    path: ["description"],
  });

type ImportJobInput = z.infer<typeof importJobInput>;

async function importJobForResume(
  db: Database,
  userId: string,
  resume: Awaited<ReturnType<typeof getOwnedResume>>,
  input: ImportJobInput,
) {
  if (!resume.data) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "That resume is empty. Add some content before scoring jobs against it.",
    });
  }

  const trimmedUrl = input.url?.trim() || undefined;
  if (trimmedUrl && !safeParseUrl(trimmedUrl)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "That job URL is not valid." });
  }

  const adapter = resolveAdapterForUrl(trimmedUrl);
  if (!adapter.fromUserInput) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "That source cannot be imported." });
  }

  const provenance: JobProvenance =
    trimmedUrl && !input.description?.trim() ? "url_import" : "paste";
  const job = adapter.fromUserInput(
    {
      url: trimmedUrl,
      description: input.description,
      title: input.title,
      company: input.company,
      location: input.location,
    },
    provenance,
  );

  if (!job.description.trim() && !trimmedUrl) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Paste the job description so it can be scored.",
    });
  }

  const posting = await upsertPosting(db, userId, job);
  const matchId = await scoreAndUpsertMatch(db, {
    userId,
    postingId: posting.id,
    resumeId: resume.id,
    resumeData: resume.data,
    resumeUpdatedAt: resume.updatedAt,
    jobDescription: job.description,
  });

  return {
    matchId,
    deduped: posting.deduped,
    source: job.source,
    attribution: adapter.capabilities.attribution,
  };
}

export const jobHunterRouter = createTRPCRouter({
  /**
   * Import a job the user supplied and score it. No model call, no credits.
   */
  importJob: protectedProcedure.input(importJobInput).mutation(async ({ ctx, input }) => {
    const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
    return importJobForResume(ctx.db, ctx.user.id, resume, input);
  }),

  bulkImportJobs: protectedProcedure
    .input(
      z.object({
        resumeId: z.string().min(1),
        urls: z.array(z.string().trim().min(1).max(2048)).min(1).max(20),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      const results = [] as Array<{
        url: string;
        status: "imported" | "duplicate" | "failed";
        message?: string;
      }>;

      for (const url of input.urls) {
        try {
          const result = await importJobForResume(ctx.db, ctx.user.id, resume, {
            resumeId: input.resumeId,
            url,
          });
          results.push({ url, status: result.deduped ? "duplicate" : "imported" });
        } catch (error) {
          results.push({
            url,
            status: "failed",
            message: error instanceof Error ? error.message : "Could not import this job.",
          });
        }
      }

      return {
        imported: results.filter((result) => result.status === "imported").length,
        duplicates: results.filter((result) => result.status === "duplicate").length,
        failed: results.filter((result) => result.status === "failed").length,
        results,
      };
    }),

  compareResumes: protectedProcedure
    .input(
      z.object({
        matchId: z.string().min(1),
        resumeIds: z.array(z.string().min(1)).min(2).max(5),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const match = await getOwnedMatch(ctx.db, input.matchId, ctx.user.id);
      const uniqueResumeIds = [...new Set(input.resumeIds)];
      if (uniqueResumeIds.length < 2) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Select at least two resumes." });
      }

      const [posting, ownedResumes] = await Promise.all([
        ctx.db.query.jobPostings.findFirst({
          where: and(
            eq(jobPostings.id, match.jobPostingId),
            eq(jobPostings.userId, ctx.user.id),
          ),
          columns: { title: true, company: true, description: true },
        }),
        ctx.db.query.resumes.findMany({
          where: and(eq(resumes.userId, ctx.user.id), inArray(resumes.id, uniqueResumeIds)),
          columns: { id: true, title: true, data: true },
        }),
      ]);

      if (!posting) throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      if (ownedResumes.length !== uniqueResumeIds.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "One or more resumes were not found." });
      }

      const comparisons = uniqueResumeIds.map((resumeId) => {
        const resume = ownedResumes.find((item) => item.id === resumeId)!;
        if (!resume.data) {
          return { resumeId, resumeTitle: resume.title, error: "This resume is empty." };
        }

        const scored = scoreResumeAgainstJob(resume.data, posting.description);
        const weakestSection = [...scored.report.sectionScores].sort((a, b) => a.score - b.score)[0];
        return {
          resumeId,
          resumeTitle: resume.title,
          score: scored.score,
          matchedKeywords: scored.report.matchedKeywords.slice(0, 8),
          missingKeywords: scored.report.missingKeywords.slice(0, 8),
          weakestSection,
        };
      });

      return { posting: { title: posting.title, company: posting.company }, comparisons };
    }),

  listMatches: protectedProcedure
    .input(
      z
        .object({
          applicationStatus: z.enum(APPLICATION_STATUSES).optional(),
          minScore: z.number().int().min(0).max(100).optional(),
          limit: z.number().int().min(1).max(100).default(50),
        })
        .default({ limit: 50 }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.query.jobMatches.findMany({
        where: input.applicationStatus
          ? and(
              eq(jobMatches.userId, ctx.user.id),
              eq(jobMatches.applicationStatus, input.applicationStatus),
            )
          : eq(jobMatches.userId, ctx.user.id),
        orderBy: [desc(jobMatches.score), desc(jobMatches.createdAt)],
        limit: input.limit,
        with: {
          posting: {
            columns: {
              id: true,
              title: true,
              company: true,
              location: true,
              source: true,
              url: true,
              applyUrl: true,
              salaryText: true,
              hoursPerWeek: true,
              employmentType: true,
              // The advert body, so a card can show the overview without a
              // second request. Already capped at 5000 chars on write, and the
              // list is bounded, so the payload stays reasonable.
              description: true,
              descriptionTruncated: true,
              postedAt: true,
              archivedAt: true,
            },
          },
        },
      });

      const filtered =
        typeof input.minScore === "number"
          ? rows.filter((row) => row.score >= input.minScore!)
          : rows;

      return filtered.map((row) => ({
        id: row.id,
        score: row.score,
        pipelineStatus: row.pipelineStatus,
        applicationStatus: row.applicationStatus,
        matchedKeywords: row.report.matchedKeywords.slice(0, 8),
        missingKeywords: row.report.missingKeywords.slice(0, 8),
        sectionScores: row.report.sectionScores,
        strengths: row.report.strengths.slice(0, 4),
        topActions: row.report.topActions.slice(0, 3),
        resumeId: row.resumeId,
        tailoredResumeId: row.tailoredResumeId,
        tailoredCoverLetterId: row.tailoredCoverLetterId,
        // Lets the UI label a score computed against an older resume rather
        // than silently presenting it as current.
        scoredAt: row.scoredAt,
        resumeVersionAt: row.resumeVersionAt,
        notes: row.notes,
        appliedAt: row.appliedAt,
        createdAt: row.createdAt,
        posting: row.posting,
      }));
    }),

  /** The job a resume was tailored for, if it came out of Job Hunter. */
  tailoredFor: protectedProcedure
    .input(z.object({ resumeId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const match = await ctx.db.query.jobMatches.findFirst({
        columns: { id: true },
        where: and(
          eq(jobMatches.userId, ctx.user.id),
          eq(jobMatches.tailoredResumeId, input.resumeId),
        ),
        with: { posting: { columns: { title: true, company: true } } },
      });
      if (!match) return null;
      return { matchId: match.id, title: match.posting.title, company: match.posting.company };
    }),

  getMatch: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      await getOwnedMatch(ctx.db, input.id, ctx.user.id);

      const row = await ctx.db.query.jobMatches.findFirst({
        where: and(eq(jobMatches.id, input.id), eq(jobMatches.userId, ctx.user.id)),
        with: { posting: true },
      });

      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      return row;
    }),

  /** Re-score against the current resume. Free -- no model call. */
  rescore: protectedProcedure
    .input(z.object({ matchId: z.string().min(1), resumeId: z.string().min(1).optional() }))
    .mutation(async ({ ctx, input }) => {
      const match = await getOwnedMatch(ctx.db, input.matchId, ctx.user.id);
      const resume = await getOwnedResume(ctx.db, input.resumeId ?? match.resumeId, ctx.user.id);

      if (!resume.data) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "That resume is empty." });
      }

      const posting = await ctx.db.query.jobPostings.findFirst({
        where: and(
          eq(jobPostings.id, match.jobPostingId),
          eq(jobPostings.userId, ctx.user.id),
        ),
        columns: { description: true },
      });

      if (!posting) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job posting not found" });
      }

      const matchId = await scoreAndUpsertMatch(ctx.db, {
        userId: ctx.user.id,
        postingId: match.jobPostingId,
        resumeId: resume.id,
        resumeData: resume.data,
        resumeUpdatedAt: resume.updatedAt,
        jobDescription: posting.description,
      });

      const updated = await ctx.db.query.jobMatches.findFirst({
        where: eq(jobMatches.id, matchId),
        columns: { id: true, score: true, scoredAt: true },
      });

      return { matchId, score: updated?.score ?? 0, previousScore: match.score };
    }),

  /** User-owned status. Never written by a background run. */
  updateMatch: protectedProcedure
    .input(
      z.object({
        matchId: z.string().min(1),
        applicationStatus: z.enum(APPLICATION_STATUSES).optional(),
        notes: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await getOwnedMatch(ctx.db, input.matchId, ctx.user.id);

      const now = new Date();
      const status = input.applicationStatus;

      await ctx.db
        .update(jobMatches)
        .set({
          ...(status ? { applicationStatus: status, statusUpdatedAt: now } : {}),
          // Stamped once, when the user first says they applied, so the
          // follow-up nudge in a later phase has a date to count from.
          ...(status === "applied" ? { appliedAt: now } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          updatedAt: now,
        })
        .where(and(eq(jobMatches.id, input.matchId), eq(jobMatches.userId, ctx.user.id)));

      return { ok: true };
    }),

  deleteMatch: protectedProcedure
    .input(z.object({ matchId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const match = await getOwnedMatch(ctx.db, input.matchId, ctx.user.id);

      await ctx.db
        .delete(jobMatches)
        .where(and(eq(jobMatches.id, match.id), eq(jobMatches.userId, ctx.user.id)));

      // The posting exists only to back its matches, so drop it once the last
      // one goes. Scoped to this user, since postings are user-scoped.
      const remaining = await ctx.db.query.jobMatches.findFirst({
        where: eq(jobMatches.jobPostingId, match.jobPostingId),
        columns: { id: true },
      });

      if (!remaining) {
        await ctx.db
          .delete(jobPostings)
          .where(
            and(
              eq(jobPostings.id, match.jobPostingId),
              eq(jobPostings.userId, ctx.user.id),
            ),
          );
      }

      return { ok: true };
    }),

  /** Counts per pipeline column, for the dashboard strip. */
  stats: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.jobMatches.findMany({
      where: eq(jobMatches.userId, ctx.user.id),
      columns: { applicationStatus: true, score: true },
    });

    const byStatus = Object.fromEntries(
      APPLICATION_STATUSES.map((status) => [status, 0]),
    ) as Record<ApplicationStatus, number>;

    for (const row of rows) {
      byStatus[row.applicationStatus] += 1;
    }

    return {
      total: rows.length,
      byStatus,
      bestScore: rows.reduce((best, row) => Math.max(best, row.score), 0),
    };
  }),

  /**
   * Tailor a resume and cover letter for one job. The only paid action here.
   *
   * Charged through the precharge-and-refund-on-throw pattern, so a model
   * failure never leaves the user charged. A rewrite that does not raise the
   * ATS score is refunded too: the user asked for an improvement and did not
   * get one.
   */
  tailor: protectedProcedure
    .input(
      z.object({
        matchId: z.string().min(1),
        tone: z.enum(["professional", "confident", "enthusiastic"]).default("professional"),
        includeCoverLetter: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await enforceJobFetchRateLimit(ctx, "tailor");

      const match = await getOwnedMatch(ctx.db, input.matchId, ctx.user.id);
      const resume = await getOwnedResume(ctx.db, match.resumeId, ctx.user.id);

      if (!resume.data) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "That resume is empty." });
      }

      const posting = await ctx.db.query.jobPostings.findFirst({
        where: and(eq(jobPostings.id, match.jobPostingId), eq(jobPostings.userId, ctx.user.id)),
      });

      if (!posting) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job posting not found" });
      }

      if (!posting.description.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This job has no description saved, so there is nothing to tailor against.",
        });
      }

      const idempotencyKey = newChargeIdempotencyKey("job_tailor", ctx.user.id);

      let ai: AiConnection;
      let charged: boolean;
      try {
        const started = await beginAiAction({
          userId: ctx.user.id,
          eventType: "job_tailor",
          costUnits: JOB_TAILOR_COST,
          idempotencyKey,
          metadata: { matchId: match.id, jobPostingId: posting.id },
        });
        ai = started.ai;
        charged = started.charge !== null;
      } catch (error) {
        if (error instanceof InsufficientCreditsError) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have enough credits for this action.",
          });
        }
        throw error;
      }

      await ctx.db
        .update(jobMatches)
        .set({ pipelineStatus: "tailoring", updatedAt: new Date() })
        .where(eq(jobMatches.id, match.id));

      const refund = async (reason: string) => {
        if (charged) {
          await refundCredits({
            userId: ctx.user.id,
            eventType: "job_tailor_refund",
            refundUnits: JOB_TAILOR_COST,
            idempotencyKey: `refund:${idempotencyKey}`,
            metadata: { reason, matchId: match.id },
          });
        }
        await ctx.db
          .update(jobMatches)
          .set({ pipelineStatus: "scored", updatedAt: new Date() })
          .where(eq(jobMatches.id, match.id));
      };

      let result: Awaited<ReturnType<typeof tailorResumeForJob>>;
      try {
        result = await tailorResumeForJob({
          resumeData: resume.data,
          jobTitle: posting.title,
          companyName: posting.company,
          jobDescription: posting.description,
          tone: input.tone,
          ai,
        });
      } catch (error) {
        await refund("ai_failure");
        throw error instanceof TailorError
          ? new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
          : error;
      }

      // The deterministic scorer decides. A rewrite that does not improve is
      // not worth the user's credits, so it is refunded and nothing is written.
      if (!result.accepted) {
        await refund("no_improvement");
        return {
          accepted: false as const,
          impact: result.impact,
          message: charged
            ? "The rewrite did not improve your match score, so nothing was saved and your credits were returned."
            : "The rewrite did not improve your match score, so nothing was saved.",
        };
      }

      const now = new Date();
      const label = [posting.title, posting.company].filter(Boolean).join(" — ") || "job";

      // Real rows in the existing tables, so tailored output inherits the
      // editor, templates and PDF/DOCX export. `origin` keeps them out of the
      // documents library until the user saves them.
      const tailoredResumeId = randomUUID();
      await ctx.db.insert(resumes).values({
        id: tailoredResumeId,
        userId: ctx.user.id,
        title: `${resume.title} — ${label}`.slice(0, 200),
        templateId: resume.templateId,
        data: result.resumeData,
        status: resume.status,
        origin: "job_hunter",
        createdAt: now,
        updatedAt: now,
      });

      let tailoredCoverLetterId: string | null = null;
      if (input.includeCoverLetter && result.coverLetter) {
        tailoredCoverLetterId = randomUUID();
        await ctx.db.insert(coverLetters).values({
          id: tailoredCoverLetterId,
          userId: ctx.user.id,
          title: `Cover letter — ${label}`.slice(0, 200),
          data: normalizeCoverLetterData({
            contact: {
              firstName: result.resumeData.contact.firstName,
              lastName: result.resumeData.contact.lastName,
              email: result.resumeData.contact.email,
              phone: result.resumeData.contact.phone,
              address: "",
              city: "",
            },
            employer: {
              hiringManagerName: "",
              companyName: posting.company,
              companyAddress: "",
              jobTitle: posting.title,
            },
            content: result.coverLetter,
          }),
          origin: "job_hunter",
          createdAt: now,
          updatedAt: now,
        });
      }

      await ctx.db
        .update(jobMatches)
        .set({
          pipelineStatus: "tailored",
          tailoredResumeId,
          tailoredCoverLetterId,
          tailoredAt: now,
          tailorImpact: result.impact,
          updatedAt: now,
        })
        .where(eq(jobMatches.id, match.id));

      return {
        accepted: true as const,
        impact: result.impact,
        changes: result.changes,
        summaryOfChanges: result.summaryOfChanges,
        tailoredResumeId,
        tailoredCoverLetterId,
      };
    }),

  /**
   * Promote a tailored document into the user's library.
   *
   * Flipping `origin` is the moment generated output becomes theirs. Without
   * this the column is a one-way trapdoor and tailored documents stay invisible.
   */
  saveToDocuments: protectedProcedure
    .input(z.object({ matchId: z.string().min(1), kind: z.enum(["resume", "cover_letter"]) }))
    .mutation(async ({ ctx, input }) => {
      const match = await getOwnedMatch(ctx.db, input.matchId, ctx.user.id);

      if (input.kind === "resume") {
        if (!match.tailoredResumeId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No tailored resume for this job." });
        }
        await ctx.db
          .update(resumes)
          .set({ origin: "user", updatedAt: new Date() })
          .where(
            and(eq(resumes.id, match.tailoredResumeId), eq(resumes.userId, ctx.user.id)),
          );
        return { ok: true, id: match.tailoredResumeId };
      }

      if (!match.tailoredCoverLetterId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No tailored cover letter for this job." });
      }
      await ctx.db
        .update(coverLetters)
        .set({ origin: "user", updatedAt: new Date() })
        .where(
          and(
            eq(coverLetters.id, match.tailoredCoverLetterId),
            eq(coverLetters.userId, ctx.user.id),
          ),
        );
      return { ok: true, id: match.tailoredCoverLetterId };
    }),

  /**
   * Fetch one public OnlineJobs.ph page the user pasted, then score it.
   *
   * Disabled unless ONLINEJOBS_SCRAPE_ENABLED is set -- see the terms note in
   * lib/job-sources/onlinejobs-ph.ts. Free: the fetch and parse are
   * deterministic and no model is involved.
   */
  fetchFromUrl: protectedProcedure
    .input(z.object({ resumeId: z.string().min(1), url: z.string().min(1).max(2048) }))
    .mutation(async ({ ctx, input }) => {
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      if (!resume.data) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "That resume is empty." });
      }

      await enforceJobFetchRateLimit(ctx, "fetchFromUrl");

      let job: NormalizedJob;
      try {
        job = await fetchOnlineJobsPosting(input.url);
      } catch (error) {
        throw toTrpcError(error);
      }

      if (!job.description.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not read a description from that page. Paste the text instead.",
        });
      }

      const posting = await upsertPosting(ctx.db, ctx.user.id, job);
      const matchId = await scoreAndUpsertMatch(ctx.db, {
        userId: ctx.user.id,
        postingId: posting.id,
        resumeId: resume.id,
        resumeData: resume.data,
        resumeUpdatedAt: resume.updatedAt,
        jobDescription: job.description,
      });

      return { matchId, deduped: posting.deduped, title: job.title };
    }),

  /**
   * Re-fetch saved OnlineJobs.ph postings and re-parse them in place.
   *
   * Rows scraped by an older parser keep whatever it managed to read -- a
   * partial advert, no salary, no hours -- and there is no way to recover that
   * from the database alone. Rather than make people delete and re-add every
   * job whenever parsing improves, this refreshes them and re-scores the
   * matches, keeping their statuses, notes and tailored documents.
   *
   * Free: fetching and parsing are deterministic and scoring makes no model
   * call.
   */
  refreshPostings: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(25).default(25) }).default({ limit: 25 }))
    .mutation(async ({ ctx, input }) => {
      if (!onlineJobsPhAdapter.capabilities.fetchableOnDemand) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            onlineJobsPhAdapter.capabilities.restrictionNote ??
            "Refreshing job details is not enabled.",
        });
      }

      await enforceJobFetchRateLimit(ctx, "refreshPostings");

      const postings = await ctx.db.query.jobPostings.findMany({
        where: and(
          eq(jobPostings.userId, ctx.user.id),
          eq(jobPostings.source, "onlinejobs_ph"),
        ),
        orderBy: [desc(jobPostings.createdAt)],
        limit: input.limit,
      });

      let refreshed = 0;
      let rescored = 0;
      let failed = 0;

      for (const posting of postings) {
        if (!posting.url) continue;

        let job: NormalizedJob;
        try {
          job = await fetchOnlineJobsPosting(posting.url);
        } catch (error) {
          // One unreadable posting must not lose the rest of the batch. A stop
          // signal from the source does end it, though.
          if (
            error instanceof JobSourceError &&
            (error.code === "AUTH" || error.code === "RATE_LIMITED")
          ) {
            throw toTrpcError(error);
          }
          failed += 1;
          continue;
        }

        if (!job.description.trim()) {
          failed += 1;
          continue;
        }

        const now = new Date();
        await ctx.db
          .update(jobPostings)
          .set({
            title: job.title || posting.title,
            company: job.company || posting.company,
            location: job.location || posting.location,
            employmentType: job.employmentType,
            salaryText: job.salaryText,
            hoursPerWeek: job.hoursPerWeek,
            description: job.description,
            descriptionTruncated: job.descriptionTruncated,
            postedAt: job.postedAt ?? posting.postedAt,
            contentHash: hashJobContent({
              title: job.title,
              company: job.company,
              description: job.description,
            }),
            updatedAt: now,
          })
          .where(
            and(eq(jobPostings.id, posting.id), eq(jobPostings.userId, ctx.user.id)),
          );

        refreshed += 1;

        // A fuller advert means different keywords, so every score computed
        // against the old text is now wrong. Re-score rather than leave a
        // stale number on screen.
        const matches = await ctx.db.query.jobMatches.findMany({
          where: and(
            eq(jobMatches.jobPostingId, posting.id),
            eq(jobMatches.userId, ctx.user.id),
          ),
          columns: { id: true, resumeId: true },
        });

        for (const match of matches) {
          const resume = await ctx.db.query.resumes.findFirst({
            where: and(eq(resumes.id, match.resumeId), eq(resumes.userId, ctx.user.id)),
          });
          if (!resume?.data) continue;

          await scoreAndUpsertMatch(ctx.db, {
            userId: ctx.user.id,
            postingId: posting.id,
            resumeId: resume.id,
            resumeData: resume.data,
            resumeUpdatedAt: resume.updatedAt,
            jobDescription: job.description,
          });
          rescored += 1;
        }
      }

      return { considered: postings.length, refreshed, rescored, failed };
    }),

  /**
   * Search OnlineJobs.ph and score every result against the chosen resume.
   *
   * Disabled unless ONLINEJOBS_SCRAPE_ENABLED is set. Bounded per call by the
   * adapter, and rate limited here so it cannot be driven in a loop.
   */
  searchSource: protectedProcedure
    .input(
      z.object({
        resumeId: z.string().min(1),
        query: z.string().min(2).max(PROMPT_INPUT_LIMITS.targetRole),
        limit: z.number().int().min(1).max(10).default(5),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!onlineJobsPhAdapter.capabilities.pollable || !onlineJobsPhAdapter.search) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            onlineJobsPhAdapter.capabilities.restrictionNote ??
            "Searching this source is not enabled.",
        });
      }

      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      if (!resume.data) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "That resume is empty." });
      }

      await enforceJobFetchRateLimit(ctx, "searchSource");

      const controller = new AbortController();
      let jobs: NormalizedJob[];
      try {
        jobs = await onlineJobsPhAdapter.search(
          { query: input.query, location: "", limit: input.limit },
          controller.signal,
        );
      } catch (error) {
        throw toTrpcError(error);
      }

      let imported = 0;
      let deduped = 0;

      for (const job of jobs) {
        if (!job.description.trim()) continue;

        const posting = await upsertPosting(ctx.db, ctx.user.id, job);
        if (posting.deduped) deduped += 1;
        else imported += 1;

        await scoreAndUpsertMatch(ctx.db, {
          userId: ctx.user.id,
          postingId: posting.id,
          resumeId: resume.id,
          resumeData: resume.data,
          resumeUpdatedAt: resume.updatedAt,
          jobDescription: job.description,
        });
      }

      return { found: jobs.length, imported, deduped };
    }),

  listHunts: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.jobHunts.findMany({
      where: eq(jobHunts.userId, ctx.user.id),
      orderBy: [desc(jobHunts.updatedAt)],
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      query: row.query,
      location: row.location,
      sources: row.sources,
      resumeId: row.resumeId,
      isActive: row.isActive,
      frequency: row.frequency,
      runAtMinuteUtc: row.runAtMinuteUtc,
      emailDigest: row.emailDigest,
      lastRunAt: row.lastRunAt,
      nextRunAt: row.nextRunAt,
      minScore: row.filters?.minScore ?? 0,
    }));
  }),

  upsertHunt: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1).optional(),
        name: z.string().trim().min(1).max(80),
        query: z.string().max(200).default(""),
        location: z.string().max(200).default(""),
        sources: z.array(z.enum(JOB_SOURCE_IDS)).max(4).default([]),
        resumeId: z.string().min(1),
        frequency: z.enum(["daily", "weekly", "manual"]).default("daily"),
        runAtMinuteUtc: z.number().int().min(0).max(1439).default(360),
        minScore: z.number().int().min(0).max(100).default(0),
        emailDigest: z.boolean().default(true),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);

      // A source the terms forbid polling must not be schedulable, whatever the
      // client sends. isPollableSource is the single enforcement point.
      const rejected = input.sources.filter((source) => !isPollableSource(source));
      if (rejected.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `These sources cannot be searched automatically: ${rejected.join(", ")}.`,
        });
      }

      const now = new Date();
      const nextRunAt = computeNextRunAt({
        frequency: input.frequency,
        runAtMinuteUtc: input.runAtMinuteUtc,
        from: now,
      });

      const values = {
        userId: ctx.user.id,
        name: input.name,
        query: input.query,
        location: input.location,
        sources: input.sources,
        filters: { minScore: input.minScore, keywords: [] },
        resumeId: input.resumeId,
        isActive: input.isActive,
        frequency: input.frequency,
        runAtMinuteUtc: input.runAtMinuteUtc,
        emailDigest: input.emailDigest,
        nextRunAt,
        updatedAt: now,
      };

      if (input.id) {
        const existing = await ctx.db.query.jobHunts.findFirst({
          where: and(eq(jobHunts.id, input.id), eq(jobHunts.userId, ctx.user.id)),
          columns: { id: true },
        });
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Hunt not found" });

        await ctx.db.update(jobHunts).set(values).where(eq(jobHunts.id, input.id));
        return { id: input.id };
      }

      const id = randomUUID();
      await ctx.db.insert(jobHunts).values({ ...values, id, createdAt: now });
      return { id };
    }),

  deleteHunt: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(jobHunts)
        .where(and(eq(jobHunts.id, input.id), eq(jobHunts.userId, ctx.user.id)));
      return { ok: true };
    }),

  /**
   * Run a hunt now.
   *
   * Uses the same runner the scheduler does, with a manual run key so it can
   * never collide with a scheduled slot. One executor, one code path -- running
   * interactive work through a second implementation is how the two drift.
   */
  runHuntNow: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await enforceJobFetchRateLimit(ctx, "runHuntNow");

      const hunt = await ctx.db.query.jobHunts.findFirst({
        where: and(eq(jobHunts.id, input.id), eq(jobHunts.userId, ctx.user.id)),
      });
      if (!hunt) throw new TRPCError({ code: "NOT_FOUND", message: "Hunt not found" });

      const result = await runHunt({ db: ctx.db, hunt, trigger: "manual" });
      return result;
    }),

  listRuns: protectedProcedure
    .input(z.object({ huntId: z.string().min(1), limit: z.number().int().min(1).max(20).default(10) }))
    .query(async ({ ctx, input }) => {
      const hunt = await ctx.db.query.jobHunts.findFirst({
        where: and(eq(jobHunts.id, input.huntId), eq(jobHunts.userId, ctx.user.id)),
        columns: { id: true },
      });
      if (!hunt) throw new TRPCError({ code: "NOT_FOUND", message: "Hunt not found" });

      return ctx.db.query.huntRuns.findMany({
        where: eq(huntRuns.huntId, input.huntId),
        orderBy: [desc(huntRuns.startedAt)],
        limit: input.limit,
      });
    }),

  /**
   * Which sources exist and what each is allowed to do.
   *
   * The UI renders `restrictionNote` so a user understands why OnlineJobs.ph
   * cannot be searched for them, rather than assuming the feature is broken.
   */
  listSources: protectedProcedure.query(async () => {
    const { listAdapters } = await import("@/lib/job-sources");

    return listAdapters().map((adapter) => ({
      id: adapter.id,
      label: adapter.label,
      pollable: adapter.capabilities.pollable,
      attribution: adapter.capabilities.attribution,
      restrictionNote: adapter.capabilities.restrictionNote,
    }));
  }),
});
