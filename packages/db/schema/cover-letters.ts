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
