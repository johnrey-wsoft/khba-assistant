import { z } from "zod";

// Shared by the /api/chat/suggestions route (streamObject) and the client
// (useObject), so the streamed shape stays in sync.
export const suggestionsSchema = z.object({
  suggestions: z
    .array(z.string())
    .max(4)
    .describe("Up to 4 short follow-up questions (3-6 words each)."),
});
