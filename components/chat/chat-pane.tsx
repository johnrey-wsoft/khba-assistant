"use client";

import { useChat, useCompletion, useObject } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "nextjs-toploader/app";
import { useTranslations } from "next-intl";

import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessages } from "@/components/chat/chat-messages";
import { Composer } from "@/components/chat/composer";
import { ArtifactPanel } from "@/components/chat/artifact-panel";
import { ArtifactProvider } from "@/components/chat/artifact-context";
import { useChatShell } from "@/components/chat/chat-shell-context";
import { useChatStore } from "@/components/chat/chat-store";
import type { ChatSource } from "@/components/chat/primitives";
import type { MessageFeedbackRating } from "@/drizzle/schemas/chats/message-feedback.schema";
import { messageText } from "@/lib/chat/message-text";
import { suggestionsSchema } from "@/lib/chat/suggestions.schema";
import {
  formatNow,
  generateChatId,
  stashPendingMessage,
  takePendingMessage,
} from "@/lib/chat/session";
import { getQueryKey } from "@/lib/query/get-query-keys";
import { CHAT_SUGGESTIONS, type ChatExample } from "@/constants/chat.constant";

type ChatPaneProps = {
  chatId?: string;
  // Persisted history + title for an existing chat (server-loaded on /chat/[id]).
  initialMessages?: UIMessage[];
  initialTitle?: string;
  // The current user's saved feedback, as { messageId: rating }.
  initialFeedback?: Record<string, MessageFeedbackRating>;
};

export const ChatPane = ({
  chatId,
  initialMessages,
  initialTitle,
  initialFeedback,
}: ChatPaneProps) => {
  const router = useRouter();
  const t = useTranslations("chat");
  const examples = t.raw("examples") as ChatExample[];
  const { toggleThreadList } = useChatShell();
  const { conversations, upsertConversation, setConversationTitle } = useChatStore();
  const queryClient = useQueryClient();

  // Refresh the sidebar's persisted chat list (new chat, new title, new order).
  const refreshChatList = () => queryClient.invalidateQueries({ queryKey: getQueryKey.chats.all });

  // No chatId => we're on /chat (a fresh "new consultation").
  const isNew = !chatId;

  const seed = useMemo(() => initialMessages ?? [], [initialMessages]);

  const [input, setInput] = useState("");
  const [artifact, setArtifact] = useState<{ sources: ChatSource[]; index: number } | null>(null);

  const openSource = (source: ChatSource, siblings?: ChatSource[]) => {
    const list = siblings && siblings.length > 0 ? siblings : [source];
    const index = Math.max(
      0,
      list.findIndex((s) => s.documentCode === source.documentCode)
    );
    setArtifact({ sources: list, index });
  };
  const { messages, sendMessage, setMessages, status, stop } = useChat({
    id: chatId,
    messages: seed,
    // Assistant reply finished streaming and was persisted server-side; reflect
    // the new/updated chat in the sidebar.
    onFinish: refreshChatList,
  });

  const isBusy = status === "submitted" || status === "streaming";

  // --- Streamed title (for new live conversations) ------------------------
  const { completion: titleStream, complete: generateTitle } = useCompletion({
    api: "/api/chat/title",
    streamProtocol: "text",
    // Title generated and persisted (when an id is passed); refresh the sidebar.
    onFinish: refreshChatList,
  });

  useEffect(() => {
    if (chatId && titleStream.trim()) {
      setConversationTitle(chatId, titleStream.trim());
    }
  }, [chatId, titleStream, setConversationTitle]);

  // --- On a fresh /chat/[id], send the handed-off first message ------------
  const consumedRef = useRef(false);
  useEffect(() => {
    if (isNew || consumedRef.current) return;
    const pending = takePendingMessage(chatId);
    if (pending) {
      consumedRef.current = true;
      sendMessage({ text: pending });
      // Pass the chat id so the generated title is persisted to that chat.
      generateTitle(pending, { body: { id: chatId } });
    }
  }, [isNew, chatId, sendMessage, generateTitle]);

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

  // Edit a past user prompt: drop it and everything after (the conversation
  // re-forks), then re-send the edited text so the assistant answers afresh.
  // The truncated tail is pruned from the DB by the chat route's onFinish sync.
  const editMessage = (messageId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    const index = messages.findIndex((m) => m.id === messageId);
    if (index === -1) return;
    setMessages(messages.slice(0, index));
    sendMessage({ text: trimmed });
  };

  const conversation = conversations.find((c) => c.id === chatId);
  // Live session title (updates as it streams) wins; else the server-loaded
  // title for a reopened chat.
  const headerTitle = conversation?.title ?? initialTitle;

  return (
    <ArtifactProvider openSource={openSource}>
      <div className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          title={headerTitle}
          messageCount={messages.length}
          onToggleThreadList={toggleThreadList}
        />
        <ChatMessages
          messages={messages}
          isThinking={status === "submitted"}
          examples={examples}
          onExample={submit}
          suggestions={suggestions}
          loadingSuggestions={loadingSuggestions}
          onSuggestion={submit}
          chatId={chatId}
          initialFeedback={initialFeedback}
          onEditMessage={editMessage}
        />
        <Composer
          value={input}
          onChange={setInput}
          onSubmit={() => submit(input)}
          onStop={stop}
          isBusy={isBusy}
        />
      </div>

      {artifact && (
        <ArtifactPanel
          key={artifact.sources[artifact.index]?.documentCode}
          sources={artifact.sources}
          initialIndex={artifact.index}
          onClose={() => setArtifact(null)}
        />
      )}
    </ArtifactProvider>
  );
};
