// Static UI content + shared types for the chat sidebar and composer.
// (Mock conversations were removed once chats/messages were persisted to the DB.)

export type ThreadStatus = "sourced" | "partial" | "unanswered";

// Fallback suggestion chips, shown until dynamic follow-ups stream in.
export const CHAT_SUGGESTIONS = [
  "Does mechanical parking count?",
  "Relaxation conditions",
  "Compare with Yongin",
  "Open the ordinance",
];

// Landing-screen starters, shown when a consultation is still empty. The actual
// prompts are localised (next-intl `chat.examples`); this type shapes them.
// A short `label` keeps the cluster tidy; `prompt` is the full question sent.
export type ChatExample = { label: string; prompt: string };
