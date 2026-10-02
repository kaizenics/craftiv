import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { coverLetters } from "./cover-letters";
import { resumes } from "./resumes";

/**
 * One row per visitor per day for a shared resume. `visitorHash` is a salted
 * SHA-256 of IP + user agent (lib/share.ts); raw IPs are never stored. The
 * unique index makes repeat views on the same day count once.
 */
export const resumeShareViews = sqliteTable(
  "resume_share_views",
  {
    id: text("id").primaryKey(),
    resumeId: text("resume_id")
      .notNull()
      .references(() => resumes.id, { onDelete: "cascade" }),
    visitorHash: text("visitor_hash").notNull(),
    /** UTC calendar day, YYYY-MM-DD. */
    viewedOn: text("viewed_on").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("resume_share_views_visitor_day_unique").on(
      table.resumeId,
      table.visitorHash,
      table.viewedOn,
    ),
  ],
);

/** Same as resumeShareViews, for shared cover letters. */
export const coverLetterShareViews = sqliteTable(
  "cover_letter_share_views",
  {
    id: text("id").primaryKey(),
    coverLetterId: text("cover_letter_id")
      .notNull()
      .references(() => coverLetters.id, { onDelete: "cascade" }),
    visitorHash: text("visitor_hash").notNull(),
    viewedOn: text("viewed_on").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("cover_letter_share_views_visitor_day_unique").on(
      table.coverLetterId,
      table.visitorHash,
      table.viewedOn,
    ),
  ],
);
