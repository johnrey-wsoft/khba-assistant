import type { Metadata } from "next";

import { ChatPane } from "@/components/chat/chat-pane";

export const metadata: Metadata = {
  title: "Chat",
  description: "AI chat playground (POC).",
};

export default function Page() {
  return <ChatPane />;
}
