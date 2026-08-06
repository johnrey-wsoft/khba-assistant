import { tool } from "ai";
import { z } from "zod";

import { semanticSearchKhba } from "@/lib/ai/retrieval";

export const searchKhba = tool({
  description:
    "Search the KHBA knowledge base for public legal/administrative documents " +
    "(laws, ordinances, guidelines). Use this to ground answers in real documents " +
    "rather than guessing. Returns matching documents with a short snippet.",
  inputSchema: z.object({
    query: z
      .string()
      .min(1)
      .describe("Keywords to search for, e.g. a topic, title, or document code."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(10)
      .default(5)
      .describe("Max number of documents to return."),
  }),
  execute: async ({ query, limit }) => {
    // Semantic retrieval over pgvector (PUBLIC + INDEXED only). On failure we
    // return no results rather than inventing sources — the assistant then says
    // nothing relevant was found instead of citing fabricated documents.
    try {
      const results = await semanticSearchKhba(query, limit);
      return { query, count: results.length, results };
    } catch (error) {
      console.error("[searchKhba] semantic search failed:", error);
      return { query, count: 0, results: [] };
    }
  },
});
