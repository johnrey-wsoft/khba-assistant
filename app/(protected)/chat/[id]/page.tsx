import type { Metadata } from "next";
import type { UIMessage } from "ai";

import { ChatPane } from "@/components/chat/chat-pane";
import { getSupabaseServer } from "@/lib/supabase/server";
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

  // Load the persisted conversation for the signed-in user. A brand new chat
  // (just minted on /chat) has no row yet -> undefined -> fresh pane that sends
  // the handed-off first message.
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
