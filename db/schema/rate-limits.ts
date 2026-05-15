import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  scope: text("scope").notNull(),
  route: text("route").notNull(),
  subjectType: text("subject_type").notNull(),
  subjectId: text("subject_id").notNull(),
  windowName: text("window_name").notNull(),
  windowSizeSeconds: integer("window_size_seconds").notNull(),
  windowStartMs: integer("window_start_ms").notNull(),
  count: integer("count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

