import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { resumes, shareSlugs } from "@/db/schema";
import { isValidShareToken } from "@/lib/share";
import { isValidShareSlug } from "@/lib/share-slug";

/**
 * The resume behind a public `/r/<key>`, where the key is the random token or the owner's custom link.
 * Only resolves while sharing is on. Callers get the resume id, never the token, so a visitor who came
 * in by custom link learns nothing that outlives that link.
 */
export async function resolveSharedResumeId(key: string): Promise<string | null> {
  // Token-shaped keys are only ever tokens: no fallback, so a switched-off token can't land on a custom link.
  if (isValidShareToken(key)) {
    const byToken = await db.query.resumes.findFirst({
      columns: { id: true },
      where: and(eq(resumes.shareToken, key), eq(resumes.shareEnabled, true)),
    });
    return byToken?.id ?? null;
  }
  if (!isValidShareSlug(key)) return null;

  const link = await db.query.shareSlugs.findFirst({ columns: { resumeId: true }, where: eq(shareSlugs.slug, key) });
  if (!link?.resumeId) return null;
  const resume = await db.query.resumes.findFirst({
    columns: { id: true },
    where: and(eq(resumes.id, link.resumeId), eq(resumes.shareEnabled, true)),
  });
  return resume?.id ?? null;
}
