"use client";

import * as React from "react";

// Session-only store of conversations started this session, so newly created
// chats appear in the sidebar. Not persisted (lives in the chat layout, which
// survives client navigation but not a hard refresh).

export type LiveConversation = {
  id: string;
  title: string;
  preview: string;
  when: string;
};

type ChatStoreValue = {
  conversations: LiveConversation[];
  upsertConversation: (conversation: LiveConversation) => void;
  setConversationTitle: (id: string, title: string) => void;
  removeConversation: (id: string) => void;
};

const ChatStoreContext = React.createContext<ChatStoreValue>({
  conversations: [],
  upsertConversation: () => {},
  setConversationTitle: () => {},
  removeConversation: () => {},
});

export const ChatStoreProvider = ({ children }: React.PropsWithChildren) => {
  const [conversations, setConversations] = React.useState<LiveConversation[]>([]);

  const upsertConversation = React.useCallback((conversation: LiveConversation) => {
    setConversations((prev) => {
      if (prev.some((c) => c.id === conversation.id)) {
        return prev.map((c) => (c.id === conversation.id ? { ...c, ...conversation } : c));
      }
      return [conversation, ...prev];
    });
  }, []);

  const setConversationTitle = React.useCallback((id: string, title: string) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  }, []);

  const removeConversation = React.useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const value = React.useMemo(
    () => ({ conversations, upsertConversation, setConversationTitle, removeConversation }),
    [conversations, upsertConversation, setConversationTitle, removeConversation]
  );

  return <ChatStoreContext.Provider value={value}>{children}</ChatStoreContext.Provider>;
};

export const useChatStore = () => React.useContext(ChatStoreContext);
