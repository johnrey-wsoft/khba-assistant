"use client";

import { PropsWithChildren, useState } from "react";
import { useParams } from "next/navigation";

import { ThreadList } from "@/components/chat/thread-list";
import { ChatShellProvider } from "@/components/chat/chat-shell-context";
import { ChatStoreProvider } from "@/components/chat/chat-store";
import { cn } from "@/lib/utils";

export default function ChatLayout({ children }: PropsWithChildren) {
  const params = useParams();
  const activeId = typeof params.id === "string" ? params.id : null;

  const [showThreadList, setShowThreadList] = useState(true);
  const [filter, setFilter] = useState("");

  return (
    <ChatShellProvider toggleThreadList={() => setShowThreadList((v) => !v)}>
      <ChatStoreProvider>
        <div className="flex h-svh min-w-0 overflow-hidden bg-background">
          <div
            className={cn(
              "hidden h-full w-[300px] flex-none lg:block",
              !showThreadList && "lg:hidden"
            )}
          >
            <ThreadList activeId={activeId} filter={filter} onFilterChange={setFilter} />
          </div>

          <section className="flex h-full min-w-0 flex-1 flex-col bg-card">{children}</section>
        </div>
      </ChatStoreProvider>
    </ChatShellProvider>
  );
}
