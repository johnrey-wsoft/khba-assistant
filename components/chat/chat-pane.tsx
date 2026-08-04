"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "nextjs-toploader/app";

import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessages } from "@/components/chat/chat-messages";
import { Composer } from "@/components/chat/composer";
import { useChatShell } from "@/components/chat/chat-shell-context";
import { toUIMessages } from "@/lib/chat/seed-messages";
import { generateChatId, stashPendingMessage, takePendingMessage } from "@/lib/chat/session";
import type { ChatThread } from "@/constants/chat.constant";

type ChatPaneProps = {
  chatId?: string;
  thread?: ChatThread;
};

export const ChatPane = ({ chatId, thread }: ChatPaneProps) => {
  const router = useRouter();
  const { toggleThreadList } = useChatShell();

  // No chatId => we're on /chat (a fresh "new consultation").
  const isNew = !chatId;

  const seed = useMemo(() => (thread ? toUIMessages(thread.messages) : []), [thread]);

  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop } = useChat({
    id: chatId,
    messages: seed,
  });

  const isBusy = status === "submitted" || status === "streaming";

  // On a fresh /chat/[id], send the first message handed off from /chat.
  const consumedRef = useRef(false);
  useEffect(() => {
    if (isNew || thread || consumedRef.current) return;
    const pending = takePendingMessage(chatId);
    if (pending) {
      consumedRef.current = true;
      sendMessage({ text: pending });
    }
  }, [isNew, thread, chatId, sendMessage]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;

    // On /chat: mint an id, hand off the message, and move to the thread route.
    if (isNew) {
      const id = generateChatId();
      stashPendingMessage(id, trimmed);
      setInput("");
      router.push(`/chat/${id}`);
      return;
    }

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
