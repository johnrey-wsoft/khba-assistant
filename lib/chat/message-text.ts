import type { UIMessage } from "ai";

type Part = UIMessage["parts"][number];

// Concatenate the text parts of a UIMessage (ignores tool/source parts).
export const messageText = (message: UIMessage): string =>
  message.parts
    .filter((p): p is Extract<Part, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
