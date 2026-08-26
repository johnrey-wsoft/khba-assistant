import { pgTable, uuid, varchar, unique, index } from "drizzle-orm/pg-core";

import { baseColumns } from "../base";
import { profiles } from "../profiles/profiles.schema";
import { chats } from "./chat.schema";
import { messages } from "./message.schema";
import { messageFeedbackRatingEnum } from "./enums";

export type MessageFeedbackRating = (typeof messageFeedbackRatingEnum.enumValues)[number];

// One member's rating of one assistant answer: `up` (helpful), `down`
// (not quite), or `report`. Unique per (message, user) so a rating toggles /
// updates in place. `chatId` is denormalised so all of a chat's feedback for
// the current user loads in one owner-scoped query alongside the messages.
export const messageFeedback = pgTable(
  "message_feedback",
  {
    ...baseColumns,
    messageId: varchar("message_id", { length: 255 })
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    chatId: uuid("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    rating: messageFeedbackRatingEnum("rating").notNull(),
  },
  (t) => [
    unique("message_feedback_message_user_uq").on(t.messageId, t.userId),
    index("message_feedback_chat_user_idx").on(t.chatId, t.userId),
  ]
);
