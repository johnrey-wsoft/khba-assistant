import { convertToModelMessages, createIdGenerator, type UIMessage } from "ai";

import { khbaAgent } from "@/lib/ai/khba-agent";
import { requireAuth } from "@/lib/guards/auth.guard";
import { ensureChatForUser, isPersistableChatId, saveMessages } from "@/lib/chat/store";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  // The AI SDK default transport sends the chat `id` alongside the messages.
  const { id, messages }: { id?: string; messages: UIMessage[] } = await req.json();

  // Persist only real (UUID) chats owned by this user; mock/demo threads
  // (non-UUID ids) keep streaming ephemerally as before.
  const persist = isPersistableChatId(id) && (await ensureChatForUser(id, user!.id));

  // Save the incoming user message up front so it survives a mid-stream failure.
  if (persist) await saveMessages(id!, messages);

  const result = await khbaAgent.stream({
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    // Persistence mode: gives the assistant reply a stable id and hands the full
    // updated conversation to onFinish for saving.
    originalMessages: messages,
    generateMessageId: createIdGenerator({ prefix: "msg", size: 24 }),
    onFinish: persist ? ({ messages: all }) => saveMessages(id!, all) : undefined,
  });
}
