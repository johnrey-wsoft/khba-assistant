import { openai } from "@ai-sdk/openai";
import { ToolLoopAgent, stepCountIs } from "ai";

import { searchKhba } from "./tools/search-khba.tool";

// Define once, use everywhere (route handler + client typing).
export const khbaAgent = new ToolLoopAgent({
  model: openai("gpt-4o-mini"),
  instructions: [
    "You are the KHBA assistant, an expert on Korean legal and administrative documents.",
    "When a question could be answered by a document, call the `searchKhba` tool first",
    "and ground your answer in the returned documents.",
    "Cite sources inline using markdown links of the form [n](cite:n), where n is the",
    "1-based position of the document in the searchKhba `results` array. Place the citation",
    "right after the claim it supports, e.g. 'The ratio is 0.5 [1](cite:1).'",
    "Only cite documents that were actually returned; never invent a citation.",
    "If nothing relevant is found, say so plainly instead of inventing sources.",
  ].join(" "),
  tools: {
    searchKhba,
  },
  // Allow the model to call the tool, then produce a final answer (up to 5 steps).
  stopWhen: stepCountIs(5),
});
