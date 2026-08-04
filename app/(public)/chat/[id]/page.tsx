import type { Metadata } from "next";
import { notFound } from "next/navigation";

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

  if (!thread) notFound();

  // key forces a fresh useChat (new seed) when switching threads.
  return <ChatPane key={thread.id} thread={thread} />;
}
