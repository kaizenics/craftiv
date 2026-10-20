import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { users } from "./users";
import { jobMatches } from "./job-hunter";

export type InterviewPrepQuestion = {
  question: string;
  type: "role" | "behavioural" | "motivation";
  answer: string;
  tip: string;
};

/**
 * Every generated interview prep, kept so a paid result is never lost. A new
 * set adds a row rather than replacing the old one, so earlier sets stay
 * readable. `notes` holds the user's own answer per question, keyed by index.
 */
export const interviewPreps = sqliteTable(
  "interview_preps",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    matchId: text("match_id")
      .notNull()
      .references(() => jobMatches.id, { onDelete: "cascade" }),
    questions: text("questions", { mode: "json" }).$type<InterviewPrepQuestion[]>().notNull(),
    notes: text("notes", { mode: "json" }).$type<Record<string, string>>().notNull().default({}),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("interview_preps_user_match_idx").on(t.userId, t.matchId, t.createdAt)],
);
