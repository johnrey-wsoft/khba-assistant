"use client";

import { useChat } from "@ai-sdk/react";
import { useMemo, useState } from "react";

import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessages } from "@/components/chat/chat-messages";
import { Composer } from "@/components/chat/composer";
import { useChatShell } from "@/components/chat/chat-shell-context";
import { toUIMessages } from "@/lib/chat/seed-messages";
import type { ChatThread } from "@/constants/chat.constant";

export const ChatPane = ({ thread }: { thread?: ChatThread }) => {
  const { toggleThreadList } = useChatShell();
  const seed = useMemo(() => (thread ? toUIMessages(thread.messages) : []), [thread]);

  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop } = useChat({
    id: thread?.id,
    messages: seed,
  });

  const isBusy = status === "submitted" || status === "streaming";

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  return (
    <>
      <ChatHeader
        title={thread?.title}
        subtitle={thread?.subtitle}
        baseDate={thread?.baseDate}
        messageCount={messages.length}
        onToggleThreadList={toggleThreadList}
      />
      <ChatMessages
        messages={messages}
        isThinking={status === "submitted"}
        dateLabel={thread?.when?.split(" ")[0]}
      />
      <Composer
        value={input}
        onChange={setInput}
        onSubmit={() => submit(input)}
        onSuggestion={submit}
        onStop={stop}
        isBusy={isBusy}
      />
    </>
  );
};
