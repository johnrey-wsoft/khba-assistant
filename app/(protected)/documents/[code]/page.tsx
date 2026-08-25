import type { Metadata } from "next";

import { guardChatPage } from "@/lib/guards/member.guard";

import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Document · KHBA Assistant",
};

// Full-page document viewer. Same gate as chat/search: signed-in, onboarded,
// approved (admins bypass). Standalone — no consultation sidebar.
export default async function DocumentViewerPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  await guardChatPage();
  return <PageClient code={decodeURIComponent(code)} />;
}
