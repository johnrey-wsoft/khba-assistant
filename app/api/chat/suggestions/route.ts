import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";

import { suggestionsSchema } from "@/lib/chat/suggestions.schema";
import { requireAuth } from "@/lib/guards/auth.guard";

export const maxDuration = 15;

export async function POST(req: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { context }: { context: string } = await req.json();

  const result = streamObject({
    model: openai("gpt-4o-mini"),
    schema: suggestionsSchema,
    system:
      "Suggest up to 4 concise follow-up questions (3-6 words each) the user might ask " +
      "next, grounded in the Korean legal/administrative consultation so far. Return them " +
      "in the `suggestions` array. Prefer specific, actionable questions.",
    prompt: context,
  });

  return result.toTextStreamResponse();
}
