import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

import { requireApproved } from "@/lib/guards/member.guard";
import { isPersistableChatId, setChatTitle } from "@/lib/chat/store";

export const maxDuration = 15;

export async function POST(req: Request) {
  const { user, error } = await requireApproved();
  if (error) return error;

  // `id` is optional: when the client passes the chat id, the generated title is
  // persisted on finish; otherwise it only streams back for display.
  const { prompt, id }: { prompt: string; id?: string } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system:
      "You generate a short, specific title (3-6 words) for a Korean legal/administrative " +
      "consultation, based on the user's first question. Output ONLY the title text — " +
      "no quotes, no trailing punctuation, no prefix like 'Title:'.",
    prompt,
    onFinish: isPersistableChatId(id)
      ? async ({ text }) => {
          await setChatTitle(id, user!.id, text.trim());
        }
      : undefined,
  });

  return result.toTextStreamResponse();
}
