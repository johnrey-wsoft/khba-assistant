import type { ModelMessage } from "ai";

type SearchResult = {
  documentCode?: string;
  authorityType?: string;
  securityClass?: string;
};
type SearchValue = { query?: string; results?: SearchResult[] };

// A historical searchKhba result only needs to survive as a citation map (which
// number maps to which document) — the bulky passage snippets were only needed
// to answer that turn, and re-sending them on every step balloons the context.
const toCitationMap = (value: SearchValue) => {
  const results = Array.isArray(value.results) ? value.results : [];
  return {
    note: "History compacted: passages omitted to save context — citation map only.",
    query: value.query ?? "",
    citations: results.map((r, i) => ({
      n: i + 1,
      documentCode: r.documentCode ?? "",
      authorityType: r.authorityType ?? "",
      securityClass: r.securityClass ?? "",
    })),
  };
};

// Compact searchKhba tool results that came from the input history (prior
// turns), keeping the current turn's result intact so the answer stays grounded.
// Only rewrites what the model sees this step — the UI message stream is
// unaffected, so source cards / the document panel keep the full data.
export const compactHistoricalSearchResults = (
  messages: ModelMessage[],
  initialMessages: ModelMessage[]
): ModelMessage[] => {
  const historical = new Set<string>();
  for (const message of initialMessages) {
    if (message.role !== "tool" || !Array.isArray(message.content)) continue;
    for (const part of message.content) {
      if (part.type === "tool-result" && part.toolName === "searchKhba") {
        historical.add(part.toolCallId);
      }
    }
  }
  if (historical.size === 0) return messages;

  return messages.map((message) => {
    if (message.role !== "tool" || !Array.isArray(message.content)) {
      return message;
    }
    return {
      ...message,
      content: message.content.map((part) => {
        if (
          part.type === "tool-result" &&
          part.toolName === "searchKhba" &&
          historical.has(part.toolCallId) &&
          part.output.type === "json"
        ) {
          return {
            ...part,
            output: {
              type: "json" as const,
              value: toCitationMap(part.output.value as unknown as SearchValue),
            },
          };
        }
        return part;
      }),
    };
  });
};
