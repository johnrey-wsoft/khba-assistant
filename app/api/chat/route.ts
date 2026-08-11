import { convertToModelMessages, type UIMessage } from "ai";

import { khbaAgent } from "@/lib/ai/khba-agent";
import { requireAuth } from "@/lib/guards/auth.guard";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = await khbaAgent.stream({
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
