import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { users } from "./users";
import type { BoardItemData, BoardItemKind } from "@/lib/types/board";

/** The tabs on the Applications page: each is its own board with its own cards, frames and notes. */
export const boards = sqliteTable(
  "boards",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: real("position").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("boards_user_idx").on(t.userId)],
);

/**
 * Frames, sticky notes, text labels and arrows on the user's Applications canvas.
 * Application cards stay in `applications`; only their canvas position lives there.
 */
export const boardItems = sqliteTable(
  "board_items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    boardId: text("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    kind: text("kind").$type<BoardItemKind>().notNull(),
    data: text("data", { mode: "json" }).$type<BoardItemData>().notNull().default({}),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("board_items_board_idx").on(t.userId, t.boardId)],
);
