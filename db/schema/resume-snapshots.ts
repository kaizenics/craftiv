import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

import { resumes, type ResumeDataJSON } from "./resumes";
import { users } from "./users";

export const RESUME_SNAPSHOT_KINDS = ["manual", "before_restore", "before_ai"] as const;
export type ResumeSnapshotKind = (typeof RESUME_SNAPSHOT_KINDS)[number];

/**
 * A saved copy of a resume's data and title (its version history).
 *
 * `kind` says why it exists: the user's "Save snapshot" button, or an automatic
 * safety copy taken before a restore or before an AI rewrite is applied.
 */
export const resumeSnapshots = sqliteTable(
  "resume_snapshots",
  {
    id: text("id").primaryKey(),
    resumeId: text("resume_id")
      .notNull()
      .references(() => resumes.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: RESUME_SNAPSHOT_KINDS }).notNull(),
    /** The resume's title when the snapshot was taken. */
    name: text("name").notNull(),
    data: text("data", { mode: "json" }).$type<ResumeDataJSON>().notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("resume_snapshots_resume_created_idx").on(table.resumeId, table.createdAt)],
);

export const resumeSnapshotsRelations = relations(resumeSnapshots, ({ one }) => ({
  resume: one(resumes, {
    fields: [resumeSnapshots.resumeId],
    references: [resumes.id],
  }),
}));
