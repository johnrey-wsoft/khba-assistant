import type { Metadata } from "next";
import type { UIMessage } from "ai";

import { ChatPane } from "@/components/chat/chat-pane";
import { getThread } from "@/constants/chat.constant";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getChatWithMessages } from "@/lib/chat/store";
import { toUIMessage } from "@/lib/chat/serialize";

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

  // Known mock threads seed their canned conversation (kept as a fallback).
  const thread = getThread(id);
  if (thread) return <ChatPane key={id} chatId={id} thread={thread} />;

  // Otherwise load the persisted conversation for the signed-in user. A brand
  // new chat (just minted on /chat) has no row yet -> undefined -> fresh pane
  // that sends the handed-off first message.
  let initialMessages: UIMessage[] | undefined;
  let initialTitle: string | undefined;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const loaded = await getChatWithMessages(id, user.id);
    if (loaded) {
      initialMessages = loaded.messages.map(toUIMessage);
      initialTitle = loaded.chat.title ?? undefined;
    }
  }

  // key forces a clean useChat instance per conversation.
  return (
    <ChatPane key={id} chatId={id} initialMessages={initialMessages} initialTitle={initialTitle} />
  );
}
