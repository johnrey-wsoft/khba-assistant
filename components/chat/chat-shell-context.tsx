"use client";

import * as React from "react";

type ChatShellValue = {
  toggleThreadList: () => void;
};

const ChatShellContext = React.createContext<ChatShellValue>({
  toggleThreadList: () => {},
});

export const ChatShellProvider = ({
  toggleThreadList,
  children,
}: React.PropsWithChildren<ChatShellValue>) => (
  <ChatShellContext.Provider value={{ toggleThreadList }}>{children}</ChatShellContext.Provider>
);

export const useChatShell = () => React.useContext(ChatShellContext);
