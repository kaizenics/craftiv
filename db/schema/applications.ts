import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { users } from "./users";
import { jobMatches } from "./job-hunter";
import { boards } from "./board";
import type { CustomField, StatusEntry, TrackerStatus } from "@/lib/types/applications";

/**
 * The user's own application tracker: one row per job they are pursuing, entered
 * by hand or copied from a Job Hunter match. Separate from job_matches on purpose,
 * so a tracked application keeps its notes even if the scraped job is removed.
 */
export const applications = sqliteTable(
  "applications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").$type<TrackerStatus>().notNull().default("saved"),
    // Order within its column; a drop puts the card last.
    position: real("position").notNull().default(0),
    // The tab the card lives on.
    boardId: text("board_id").references(() => boards.id, { onDelete: "set null" }),
    // Where the card sits on the canvas; null means "stack it in its status frame".
    canvasX: real("canvas_x"),
    canvasY: real("canvas_y"),
    company: text("company").notNull().default(""),
    title: text("title").notNull().default(""),
    postingUrl: text("posting_url").notNull().default(""),
    contact: text("contact").notNull().default(""),
    // Kept as the user typed it (YYYY-MM-DD from the date picker), no timezone shifts.
    appliedOn: text("applied_on").notNull().default(""),
    interviewStage: text("interview_stage").notNull().default(""),
    interviewer: text("interviewer").notNull().default(""),
    notes: text("notes").notNull().default(""),
    salary: text("salary").notNull().default(""),
    location: text("location").notNull().default(""),
    // Every column the card entered and when, oldest first; drives board stats and follow-up reminders.
    statusHistory: text("status_history", { mode: "json" }).$type<StatusEntry[]>().notNull().default([]),
    // The last AI follow-up email, kept so a paid draft is never lost.
    followUpEmail: text("follow_up_email").notNull().default(""),
    customFields: text("custom_fields", { mode: "json" }).$type<CustomField[]>().notNull().default([]),
    // Set when the card was created from a Job Hunter match; the match may later be deleted.
    matchId: text("match_id").references(() => jobMatches.id, { onDelete: "set null" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("applications_user_status_idx").on(t.userId, t.status, t.position)],
);
