import type { UIMessage } from "ai";

import type { MockMessage } from "@/constants/chat.constant";

// Turn canned mock messages into UIMessage[] that useChat can seed from.
// Assistant messages with sources get a synthetic `tool-searchKhba` output part
// so the same rendering path (source cards) lights up as it would for a live
// tool call. Parts mirror a real turn's order — the search tool call first, then
// the answer text — so the answer-extraction logic treats seeds like live turns.
export const toUIMessages = (messages: MockMessage[]): UIMessage[] =>
  messages.map((m, i) => {
    const parts: UIMessage["parts"] = [];

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

    parts.push({ type: "text", text: m.text });

    return {
      id: `seed-${i}`,
      role: m.role,
      parts,
      metadata: m.time ? { time: m.time } : undefined,
    } as UIMessage;
  });
