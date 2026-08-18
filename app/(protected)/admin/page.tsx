import type { Metadata } from "next";

import { guardAdminPage } from "@/lib/guards/member.guard";

import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "User management · KHBA Assistant",
};

export default async function AdminPage() {
  // Admins only; the current user id lets the client disable self-role changes.
  const profile = await guardAdminPage();
  return <PageClient currentUserId={profile.id} />;
}
