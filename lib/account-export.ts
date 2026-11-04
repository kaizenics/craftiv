import { eq } from "drizzle-orm";

import type { Database } from "@/db";
import {
  accounts,
  applications,
  boardItems,
  boards,
  coverLetters,
  creditEvents,
  huntRuns,
  interviewPreps,
  jobHunts,
  jobMatches,
  jobPostings,
  processedTransactions,
  resumeSnapshots,
  resumes,
  sessions,
  shareSlugs,
  userAiProviders,
  users,
} from "@/db/schema";

/** Bumped when the shape of the file changes, so an export can be read back later. */
export const ACCOUNT_EXPORT_VERSION = 1;

/**
 * Everything Craftiv stores about one user, as a single JSON document (GDPR access and portability).
 * Credentials are left out on purpose: passwords, OAuth and session tokens, the encrypted AI key and
 * share-link tokens are working secrets, and a downloaded file is easy to leak. Visitor hashes on share
 * views belong to other people and are left out too.
 */
export async function buildAccountExport(db: Database, userId: string) {
  const [
    profile,
    signIns,
    activeSessions,
    resumeRows,
    snapshotRows,
    coverLetterRows,
    applicationRows,
    boardRows,
    boardItemRows,
    huntRows,
    postingRows,
    matchRows,
    runRows,
    prepRows,
    creditRows,
    purchaseRows,
    aiProvider,
    slugRows,
  ] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }),
    db.query.accounts.findMany({
      columns: { providerId: true, createdAt: true, updatedAt: true },
      where: eq(accounts.userId, userId),
    }),
    db.query.sessions.findMany({
      columns: { createdAt: true, expiresAt: true, ipAddress: true, userAgent: true },
      where: eq(sessions.userId, userId),
    }),
    db.query.resumes.findMany({ columns: { shareToken: false }, where: eq(resumes.userId, userId) }),
    db.query.resumeSnapshots.findMany({ where: eq(resumeSnapshots.userId, userId) }),
    db.query.coverLetters.findMany({ columns: { shareToken: false }, where: eq(coverLetters.userId, userId) }),
    db.query.applications.findMany({ where: eq(applications.userId, userId) }),
    db.query.boards.findMany({ where: eq(boards.userId, userId) }),
    db.query.boardItems.findMany({ where: eq(boardItems.userId, userId) }),
    db.query.jobHunts.findMany({ where: eq(jobHunts.userId, userId) }),
    db.query.jobPostings.findMany({ where: eq(jobPostings.userId, userId) }),
    db.query.jobMatches.findMany({ where: eq(jobMatches.userId, userId) }),
    db.query.huntRuns.findMany({ where: eq(huntRuns.userId, userId) }),
    db.query.interviewPreps.findMany({ where: eq(interviewPreps.userId, userId) }),
    db.query.creditEvents.findMany({ where: eq(creditEvents.userId, userId) }),
    db.query.processedTransactions.findMany({ where: eq(processedTransactions.userId, userId) }),
    db.query.userAiProviders.findFirst({ columns: { encryptedKey: false }, where: eq(userAiProviders.userId, userId) }),
    db.query.shareSlugs.findMany({ where: eq(shareSlugs.userId, userId) }),
  ]);

  return {
    exportVersion: ACCOUNT_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    profile,
    signInMethods: signIns,
    sessions: activeSessions,
    resumes: resumeRows,
    resumeVersions: snapshotRows,
    coverLetters: coverLetterRows,
    customShareLinks: slugRows,
    applicationTracker: { boards: boardRows, boardItems: boardItemRows, applications: applicationRows },
    jobHunter: { hunts: huntRows, postings: postingRows, matches: matchRows, runs: runRows, interviewPreps: prepRows },
    credits: { balanceUnits: profile?.creditBalance ?? 0, events: creditRows, purchases: purchaseRows },
    ownAiKey: aiProvider ?? null,
  };
}
