import "server-only";

import { and, asc, desc, eq, inArray, isNull, notInArray, sql } from "drizzle-orm";
import type { UIMessage } from "ai";

import { db } from "@/lib/drizzle/db";
import { chats, messages, messageFeedback } from "@/drizzle/schemas";
import type { MessageFeedbackRating } from "@/drizzle/schemas/chats/message-feedback.schema";
import type { SelectChat, SelectMessage } from "@/types/drizzle.types";
import type { ChatMessageMetadata, ChatMessagePart } from "@/drizzle/schemas/chats/message.schema";
import type { ChatListItem } from "@/lib/chat/types";
import { previewFromParts } from "@/lib/chat/serialize";

// Server-side persistence for chats + messages. Kept out of the API routes so
// the same helpers back the streaming chat route and the REST endpoints.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The chat id is minted client-side (crypto.randomUUID) and stored as a uuid
// PK. Mock/demo threads use non-uuid ids (e.g. "t-1") and must NOT be persisted
// — they stream ephemerally. Use this to gate every write.
export const isPersistableChatId = (id: unknown): id is string =>
  typeof id === "string" && UUID_RE.test(id);

// Ensure a chat row exists for this user. Returns true when the caller may
// persist to it (row is newly created, or already owned by this user), false
// when the id belongs to someone else.
export const ensureChatForUser = async (id: string, userId: string): Promise<boolean> => {
  const existing = await db
    .select({ userId: chats.userId })
    .from(chats)
    .where(eq(chats.id, id))
    .limit(1);

  if (existing.length === 0) {
    // onConflictDoNothing guards the race where two requests create it at once.
    await db.insert(chats).values({ id, userId }).onConflictDoNothing();
    return true;
  }

  return existing[0].userId === userId;
};

// Upsert a batch of UIMessages for a chat, keyed on the message's own id so
// re-saving the same conversation is idempotent. Also bumps the chat's
// updatedAt so the thread list can order by recency.
export const saveMessages = async (chatId: string, list: UIMessage[]): Promise<void> => {
  if (list.length === 0) return;

  const rows = list.map((m) => ({
    id: m.id,
    chatId,
    role: m.role,
    parts: m.parts as ChatMessagePart[],
    metadata: (m.metadata ?? null) as ChatMessageMetadata | null,
  }));

  await db
    .insert(messages)
    .values(rows)
    .onConflictDoUpdate({
      target: messages.id,
      set: {
        parts: sql`excluded.parts`,
        metadata: sql`excluded.metadata`,
        updatedAt: new Date(),
      },
    });

  await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId));
};

// Persist the full conversation, then prune any of the chat's messages no longer
// present in `list` — e.g. after a prompt edit truncates the tail and re-forks.
// `list` must be the complete, authoritative message list for the chat.
export const syncMessages = async (chatId: string, list: UIMessage[]): Promise<void> => {
  await saveMessages(chatId, list);

  const ids = list.map((m) => m.id);
  await db
    .delete(messages)
    .where(
      ids.length > 0
        ? and(eq(messages.chatId, chatId), notInArray(messages.id, ids))
        : eq(messages.chatId, chatId)
    );
};

// Set (or regenerate) a chat's title. Scoped to the owner so it can't retitle
// someone else's chat. Returns false when nothing matched (not owned / missing).
export const setChatTitle = async (
  chatId: string,
  userId: string,
  title: string
): Promise<boolean> => {
  const updated = await db
    .update(chats)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId), isNull(chats.deletedAt)))
    .returning({ id: chats.id });

  return updated.length > 0;
};

// A user's chats, newest first, excluding soft-deleted rows. Each row carries a
// preview (the text of its earliest message) for the sidebar.
export const listChatsByUser = async (userId: string): Promise<ChatListItem[]> => {
  const rows = await db
    .select()
    .from(chats)
    .where(and(eq(chats.userId, userId), isNull(chats.deletedAt)))
    .orderBy(desc(chats.updatedAt));

  if (rows.length === 0) return [];

  // Earliest message per chat (DISTINCT ON requires the distinct column to lead
  // the ORDER BY), used to derive the preview line.
  const firstMessages = await db
    .selectDistinctOn([messages.chatId], { chatId: messages.chatId, parts: messages.parts })
    .from(messages)
    .where(
      inArray(
        messages.chatId,
        rows.map((r) => r.id)
      )
    )
    .orderBy(messages.chatId, asc(messages.createdAt));

  const previewByChat = new Map(firstMessages.map((m) => [m.chatId, previewFromParts(m.parts)]));

  return rows.map((row) => ({ ...row, preview: previewByChat.get(row.id) ?? "" }));
};

// A single owned chat with its messages in send order, or null if it doesn't
// exist / isn't owned by this user.
export const getChatWithMessages = async (
  chatId: string,
  userId: string
): Promise<{
  chat: SelectChat;
  messages: SelectMessage[];
  feedback: Record<string, MessageFeedbackRating>;
} | null> => {
  // The id is a uuid column; a non-uuid route param (e.g. /chat/favicon.ico)
  // would make Postgres throw, so treat it as "no such chat".
  if (!isPersistableChatId(chatId)) return null;

  const chat = (
    await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, userId), isNull(chats.deletedAt)))
      .limit(1)
  )[0];

  if (!chat) return null;

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt));

  // This user's ratings for the chat's messages, as { messageId: rating }.
  // Never let a feedback failure (e.g. the table not migrated yet) break the
  // core conversation load — degrade to "no saved feedback".
  let feedback: Record<string, MessageFeedbackRating> = {};
  try {
    const fbRows = await db
      .select({ messageId: messageFeedback.messageId, rating: messageFeedback.rating })
      .from(messageFeedback)
      .where(and(eq(messageFeedback.chatId, chatId), eq(messageFeedback.userId, userId)));
    feedback = Object.fromEntries(
      fbRows.map((r) => [r.messageId, r.rating] as [string, MessageFeedbackRating])
    );
  } catch (error) {
    console.error("Failed to load message feedback (is the migration applied?):", error);
  }

  return { chat, messages: rows, feedback };
};

// Set, change, or clear (rating === null) this user's feedback on one answer.
// Owner-scoped: the chat must belong to the user and the message to the chat.
// Returns false when either check fails.
export const setMessageFeedback = async (
  chatId: string,
  userId: string,
  messageId: string,
  rating: MessageFeedbackRating | null
): Promise<boolean> => {
  if (!isPersistableChatId(chatId)) return false;

  const owned =
    (
      await db
        .select({ id: chats.id })
        .from(chats)
        .where(and(eq(chats.id, chatId), eq(chats.userId, userId), isNull(chats.deletedAt)))
        .limit(1)
    ).length > 0;
  if (!owned) return false;

  const messageInChat =
    (
      await db
        .select({ id: messages.id })
        .from(messages)
        .where(and(eq(messages.id, messageId), eq(messages.chatId, chatId)))
        .limit(1)
    ).length > 0;
  if (!messageInChat) return false;

  if (rating === null) {
    await db
      .delete(messageFeedback)
      .where(and(eq(messageFeedback.messageId, messageId), eq(messageFeedback.userId, userId)));
    return true;
  }

  await db
    .insert(messageFeedback)
    .values({ messageId, chatId, userId, rating })
    .onConflictDoUpdate({
      target: [messageFeedback.messageId, messageFeedback.userId],
      set: { rating, updatedAt: new Date() },
    });
  return true;
};

// Soft-delete an owned chat (sets deletedAt; messages are retained). Returns
// false when nothing matched (already deleted, or not owned).
export const softDeleteChat = async (chatId: string, userId: string): Promise<boolean> => {
  const deleted = await db
    .update(chats)
    .set({ deletedAt: new Date() })
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId), isNull(chats.deletedAt)))
    .returning({ id: chats.id });

  return deleted.length > 0;
};
