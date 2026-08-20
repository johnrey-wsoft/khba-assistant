import type { Metadata } from "next";
import type { UIMessage } from "ai";

import { ChatPane } from "@/components/chat/chat-pane";
import { guardChatPage } from "@/lib/guards/member.guard";
import { getChatWithMessages } from "@/lib/chat/store";
import { toUIMessage } from "@/lib/chat/serialize";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Consultation",
  description: "AI chat playground (POC).",
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  // Signed in + onboarded + desk-approved, or redirected away. The profile id is
  // the auth user id.
  const profile = await guardChatPage();

  // Load the persisted conversation. A brand new chat (just minted on /chat) has
  // no row yet -> undefined -> fresh pane that sends the handed-off first message.
  let initialMessages: UIMessage[] | undefined;
  let initialTitle: string | undefined;

  const loaded = await getChatWithMessages(id, profile.id);
  if (loaded) {
    initialMessages = loaded.messages.map(toUIMessage);
    initialTitle = loaded.chat.title ?? undefined;
  }

  // key forces a clean useChat instance per conversation.
  return (
    <ChatPane key={id} chatId={id} initialMessages={initialMessages} initialTitle={initialTitle} />
  );
}
