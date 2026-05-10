import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

import { users } from "./users";

export const processedTransactions = sqliteTable("processed_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("internal"),
  transactionId: text("transaction_id").notNull().unique(),
  plan: text("plan", { enum: ["active", "plus", "pro"] }).notNull(),
  status: text("status").notNull().default("completed"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const processedTransactionsRelations = relations(
  processedTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [processedTransactions.userId],
      references: [users.id],
    }),
  })
);
