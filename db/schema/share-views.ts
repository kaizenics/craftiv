import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { coverLetters } from "./cover-letters";
import { resumes } from "./resumes";
import { users } from "./users";

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

/**
 * Custom resume links (/r/john-smith). A link stays reserved to the user who first
 * claimed it, even after it is taken off a resume or the account is deleted, so a
 * link someone has already printed or sent can never start showing another person.
 * `resumeId` is the resume it currently opens; null means reserved but unused.
 */
export const shareSlugs = sqliteTable(
  "share_slugs",
  {
    slug: text("slug").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    resumeId: text("resume_id").references(() => resumes.id, { onDelete: "set null" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("share_slugs_resume_unique").on(table.resumeId),
    index("share_slugs_user_idx").on(table.userId),
  ],
);
