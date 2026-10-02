import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import type { CoverLetterData } from "@/lib/types/cover-letter";

/**
 * Cover letters — full editor payload stored as JSON (same shape as CoverLetterData).
 */
export const coverLetters = sqliteTable("cover_letters", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  data: text("data", { mode: "json" }).$type<CoverLetterData>().notNull(),
  /**
   * Who created this letter. Job Hunter writes real `cover_letters` rows so
   * tailored output inherits the editor, preview and PDF export unchanged --
   * but those rows must not clutter the documents library, so every list query
   * filters on `origin = "user"`. A "Save to my documents" action flips it,
   * which is the moment the user opts a generated letter into their library.
   */
  origin: text("origin", { enum: ["user", "job_hunter"] })
    .notNull()
    .default("user"),
  /** Random id for the public /c/<token> link; null until sharing is first enabled. */
  shareToken: text("share_token").unique(),
  shareEnabled: integer("share_enabled", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const coverLettersRelations = relations(coverLetters, ({ one }) => ({
  user: one(users, {
    fields: [coverLetters.userId],
    references: [users.id],
  }),
}));
