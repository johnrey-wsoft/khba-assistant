import { pgTable, uuid, varchar, jsonb, index } from "drizzle-orm/pg-core";
import type { UIMessage } from "ai";

// Base columns (created/updated/deleted timestamps). We override `id` below.
import { baseColumns } from "../base";
import { chats } from "./chat.schema";
import { messageRoleEnum } from "./enums";

// One AI SDK v5 UIMessage. We persist `parts` (and `metadata`) as JSONB rather
// than a flat text column so tool calls, source/evidence cards
// (`tool-searchKhba`), reasoning, and inline citations survive a round-trip
// through useChat.
export type ChatMessagePart = UIMessage["parts"][number];
// Assistant seed messages carry `{ time }`; kept open for future metadata.
export type ChatMessageMetadata = { time?: string } & Record<string, unknown>;

export const messages = pgTable(
  "messages",
  {
    ...baseColumns,
    // The UIMessage id is a string minted by the AI SDK (not always a UUID), so
    // the PK is a varchar holding that id verbatim. This lets persistence upsert
    // by the message's own id and stay idempotent across re-saves.
    id: varchar("id", { length: 255 }).primaryKey(),
    chatId: uuid("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    role: messageRoleEnum("role").notNull(),
    parts: jsonb("parts").$type<ChatMessagePart[]>().notNull().default([]),
    metadata: jsonb("metadata").$type<ChatMessageMetadata>(),
  },
  (t) => [
    // Load a conversation: filter by chat, order by createdAt.
    index("messages_chat_id_idx").on(t.chatId),
  ]
);
