import { relations } from "drizzle-orm";

import { profiles } from "../profiles/profiles.schema";
import { chats } from "./chat.schema";
import { messages } from "./message.schema";

// chat -> owner (profile) and its messages.
export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(profiles, {
    fields: [chats.userId],
    references: [profiles.id],
  }),
  messages: many(messages),
}));

// message -> its parent chat.
export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));

// First relation defined on profiles: a user's chats. (Uses relationName-free
// default; profiles had no relations() until now.)
export const profilesRelations = relations(profiles, ({ many }) => ({
  chats: many(chats),
}));
