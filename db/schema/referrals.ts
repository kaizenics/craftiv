import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { users } from "./users";

/**
 * One row per invited account: who invited whom. `referredId` is unique, so an account can be
 * referred once. `referrerRewarded` is false when the referrer had already hit the monthly cap;
 * the invited friend is still paid. Credits move through credit_events like every other grant.
 */
export const referrals = sqliteTable(
  "referrals",
  {
    id: text("id").primaryKey(),
    referrerId: text("referrer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    referredId: text("referred_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    referrerRewarded: integer("referrer_rewarded", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("referrals_referrer_created_idx").on(t.referrerId, t.createdAt)],
);
