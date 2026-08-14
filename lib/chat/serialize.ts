import type { UIMessage } from "ai";

import type { SelectMessage } from "@/types/drizzle.types";
import type { ChatMessagePart } from "@/drizzle/schemas/chats/message.schema";

// Turn a persisted message row back into the UIMessage that useChat renders.
// Parts are stored verbatim, so tool calls / source cards / citations reappear
// exactly as they streamed.
export const toUIMessage = (row: SelectMessage): UIMessage =>
  ({
    id: row.id,
    role: row.role,
    parts: row.parts,
    ...(row.metadata ? { metadata: row.metadata } : {}),
  }) as UIMessage;

// The first text part of a message, used as the sidebar preview line.
export const previewFromParts = (parts: ChatMessagePart[] | null | undefined): string => {
  if (!Array.isArray(parts)) return "";
  const textPart = parts.find(
    (p): p is Extract<ChatMessagePart, { type: "text" }> => p?.type === "text"
  );
  return textPart?.text?.trim() ?? "";
};
