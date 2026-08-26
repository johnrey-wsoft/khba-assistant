import type { SelectChat, SelectMessage } from "@/types/drizzle.types";
import type { MessageFeedbackRating } from "@/drizzle/schemas/chats/message-feedback.schema";

// A chat row plus a short preview (the first message's text) for the sidebar.
export type ChatListItem = SelectChat & { preview: string };

// A single chat with its messages, as returned by GET /api/chats/[id]. `feedback`
// maps a message id to the current user's rating for it.
export type ChatWithMessages = {
  chat: SelectChat;
  messages: SelectMessage[];
  feedback: Record<string, MessageFeedbackRating>;
};
