import type { Metadata } from "next";

import { ChatPane } from "@/components/chat/chat-pane";
import { getThread } from "@/constants/chat.constant";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const thread = getThread(id);
  return {
    title: thread ? thread.title : "Consultation",
    description: "AI chat playground (POC).",
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const thread = getThread(id);

  // Known mock threads seed their conversation; any other id is a fresh
  // (live) consultation started from /chat. key forces a clean useChat.
  return <ChatPane key={id} chatId={id} thread={thread ?? undefined} />;
}
