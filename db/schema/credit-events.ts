import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

import { users } from "./users";

export const creditEvents = sqliteTable("credit_events", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  deltaUnits: integer("delta_units").notNull(),
  balanceAfterUnits: integer("balance_after_units").notNull(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  metadataJson: text("metadata_json", { mode: "json" }).$type<Record<string, unknown> | null>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const creditEventsRelations = relations(creditEvents, ({ one }) => ({
  user: one(users, {
    fields: [creditEvents.userId],
    references: [users.id],
  }),
}));
