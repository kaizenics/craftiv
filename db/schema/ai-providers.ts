import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

import type { AiProviderId } from "@/lib/ai-providers";
import { users } from "./users";

/**
 * A user's own AI provider connection ("bring your own AI").
 *
 * One row per user: a person uses one provider at a time, and keying on the
 * user makes "which key do I use" a primary-key lookup rather than a choice.
 *
 * `encryptedKey` is AES-256-GCM ciphertext (lib/ai-key-crypto.ts). The plain key
 * is never stored and never sent back to the browser; `keyHint` is the last four
 * characters, captured at save time so the UI can show which key is connected.
 */
export const userAiProviders = sqliteTable("user_ai_providers", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").$type<AiProviderId>().notNull(),
  model: text("model").notNull(),
  encryptedKey: text("encrypted_key").notNull(),
  keyHint: text("key_hint").notNull(),
  /** Lets a user fall back to credits without deleting their key. */
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  lastVerifiedAt: integer("last_verified_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const userAiProvidersRelations = relations(userAiProviders, ({ one }) => ({
  user: one(users, {
    fields: [userAiProviders.userId],
    references: [users.id],
  }),
}));
