import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export const maxDuration = 15;

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system:
      "You generate a short, specific title (3-6 words) for a Korean legal/administrative " +
      "consultation, based on the user's first question. Output ONLY the title text — " +
      "no quotes, no trailing punctuation, no prefix like 'Title:'.",
    prompt,
  });

  return result.toTextStreamResponse();
}
