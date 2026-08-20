import type { Metadata } from "next";

import { guardChatPage } from "@/lib/guards/member.guard";

import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Search · KHBA Assistant",
};

// Faceted search over the public corpus. Same gate as chat: signed-in,
// onboarded, approved (admins bypass).
export default async function SearchPage() {
  await guardChatPage();
  return <PageClient />;
}
