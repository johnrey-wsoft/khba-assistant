import type { Metadata } from "next";

import { ChatPane } from "@/components/chat/chat-pane";
import { guardChatPage } from "@/lib/guards/member.guard";

export const metadata: Metadata = {
  title: "Chat",
  description: "AI chat playground (POC).",
};

export default async function Page() {
  // Signed in + onboarded + desk-approved, or redirected away.
  await guardChatPage();
  return <ChatPane />;
}
