"use client";

import { useChat, useCompletion, useObject } from "@ai-sdk/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "nextjs-toploader/app";

import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessages } from "@/components/chat/chat-messages";
import { Composer } from "@/components/chat/composer";
import { ArtifactPanel } from "@/components/chat/artifact-panel";
import { ArtifactProvider } from "@/components/chat/artifact-context";
import { useChatShell } from "@/components/chat/chat-shell-context";
import { useChatStore } from "@/components/chat/chat-store";
import type { ChatSource } from "@/components/chat/primitives";
import { toUIMessages } from "@/lib/chat/seed-messages";
import { messageText } from "@/lib/chat/message-text";
import { suggestionsSchema } from "@/lib/chat/suggestions.schema";
import {
  formatNow,
  generateChatId,
  stashPendingMessage,
  takePendingMessage,
} from "@/lib/chat/session";
import { CHAT_SUGGESTIONS, type ChatThread } from "@/constants/chat.constant";

type ChatPaneProps = {
  chatId?: string;
  thread?: ChatThread;
};

export const ChatPane = ({ chatId, thread }: ChatPaneProps) => {
  const router = useRouter();
  const { toggleThreadList } = useChatShell();
  const { conversations, upsertConversation, setConversationTitle } = useChatStore();

  // No chatId => we're on /chat (a fresh "new consultation").
  const isNew = !chatId;

  const seed = useMemo(() => (thread ? toUIMessages(thread.messages) : []), [thread]);

  const [input, setInput] = useState("");
  const [activeSource, setActiveSource] = useState<ChatSource | null>(null);
  const { messages, sendMessage, status, stop } = useChat({
    id: chatId,
    messages: seed,
  });

  const isBusy = status === "submitted" || status === "streaming";

  // --- Streamed title (for new live conversations) ------------------------
  const { completion: titleStream, complete: generateTitle } = useCompletion({
    api: "/api/chat/title",
    streamProtocol: "text",
  });

  useEffect(() => {
    if (chatId && titleStream.trim()) {
      setConversationTitle(chatId, titleStream.trim());
    }
  }, [chatId, titleStream, setConversationTitle]);

  // --- On a fresh /chat/[id], send the handed-off first message ------------
  const consumedRef = useRef(false);
  useEffect(() => {
    if (isNew || thread || consumedRef.current) return;
    const pending = takePendingMessage(chatId);
    if (pending) {
      consumedRef.current = true;
      sendMessage({ text: pending });
      generateTitle(pending);
    }
  }, [isNew, thread, chatId, sendMessage, generateTitle]);

  // --- Dynamic follow-up suggestions (useObject) --------------------------
  const {
    object: suggestionObject,
    submit: generateSuggestions,
    isLoading: isSuggesting,
  } = useObject({
    api: "/api/chat/suggestions",
    schema: suggestionsSchema,
  });

  const lastMessage = messages[messages.length - 1];
  const lastAssistantId = lastMessage?.role === "assistant" ? lastMessage.id : null;
  const suggestedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!lastAssistantId || isBusy) return;
    if (suggestedForRef.current === lastAssistantId) return;
    suggestedForRef.current = lastAssistantId;
    const context = messages
      .slice(-4)
      .map((m) => `${m.role}: ${messageText(m)}`)
      .join("\n");
    generateSuggestions({ context });
  }, [lastAssistantId, isBusy, messages, generateSuggestions]);

  const dynamicSuggestions = (suggestionObject?.suggestions ?? []).filter(
    (s): s is string => typeof s === "string" && s.trim().length > 0
  );
  const suggestions = dynamicSuggestions.length > 0 ? dynamicSuggestions : CHAT_SUGGESTIONS;
  // Show skeletons while generating, until the first suggestion streams in.
  const loadingSuggestions = isSuggesting && dynamicSuggestions.length === 0;

  // --- Submit -------------------------------------------------------------
  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;

    // On /chat: mint an id, register the conversation, hand off the message,
    // and move to the thread route.
    if (isNew) {
      const id = generateChatId();
      stashPendingMessage(id, trimmed);
      upsertConversation({
        id,
        title: "New consultation",
        preview: trimmed,
        when: formatNow(),
      });
      setInput("");
      router.push(`/chat/${id}`);
      return;
    }

    sendMessage({ text: trimmed });
    setInput("");
  };

  const conversation = conversations.find((c) => c.id === chatId);
  const headerTitle = thread?.title ?? conversation?.title;

  return (
    <ArtifactProvider openSource={setActiveSource}>
      <div className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          title={headerTitle}
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
          suggestions={suggestions}
          loadingSuggestions={loadingSuggestions}
        />
      </div>

      {activeSource && (
        <ArtifactPanel source={activeSource} onClose={() => setActiveSource(null)} />
      )}
    </ArtifactProvider>
  );
};
