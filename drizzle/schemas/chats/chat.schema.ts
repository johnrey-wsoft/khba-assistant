import { pgTable, uuid, varchar, index } from "drizzle-orm/pg-core";

// Base columns (id, created/updated/deleted) — same set profiles uses.
import { baseColumns } from "../base";
import { profiles } from "../profiles/profiles.schema";

// A conversation ("consultation"). The id is a UUID minted client-side
// (crypto.randomUUID in lib/chat/session.ts) and used in the /chat/[id] route,
// so it round-trips straight into this PK; defaultRandom covers server-created
// rows too. Title is generated asynchronously (POST /api/chat/title), so it is
// nullable until the stream lands.
export const chats = pgTable(
  "chats",
  {
    ...baseColumns,
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }),
  },
  (t) => [
    // Thread list: "my chats, newest first" — filter by user, order by updatedAt.
    index("chats_user_id_idx").on(t.userId),
  ]
);
