import type { SelectChat, SelectMessage } from "@/types/drizzle.types";

// A chat row plus a short preview (the first message's text) for the sidebar.
export type ChatListItem = SelectChat & { preview: string };

// A single chat with its messages, as returned by GET /api/chats/[id].
export type ChatWithMessages = { chat: SelectChat; messages: SelectMessage[] };
