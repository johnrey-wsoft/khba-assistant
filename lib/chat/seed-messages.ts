import type { UIMessage } from "ai";

import type { MockMessage } from "@/constants/chat.constant";

// Turn canned mock messages into UIMessage[] that useChat can seed from.
// Assistant messages with sources get a synthetic `tool-searchKhba` output part
// so the same rendering path (SourceCard, "Well sourced") lights up as it would
// for a live tool call.
export const toUIMessages = (messages: MockMessage[]): UIMessage[] =>
  messages.map((m, i) => {
    const parts: UIMessage["parts"] = [{ type: "text", text: m.text }];

    if (m.role === "assistant" && m.sources?.length) {
      parts.push({
        type: "tool-searchKhba",
        toolCallId: `seed-${i}`,
        state: "output-available",
        input: { query: m.query ?? "" },
        output: {
          query: m.query ?? "",
          count: m.sources.length,
          results: m.sources,
        },
      } as UIMessage["parts"][number]);
    }

    return {
      id: `seed-${i}`,
      role: m.role,
      parts,
      metadata: m.time ? { time: m.time } : undefined,
    } as UIMessage;
  });
