import type { Metadata } from "next";

import { guardPendingPage } from "@/lib/guards/member.guard";

import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Verification in progress · KHBA Assistant",
};

export default async function PendingPage() {
  // Only reachable after onboarding while not yet approved.
  const profile = await guardPendingPage();

  return (
    <PageClient
      status={profile.verificationStatus}
      email={profile.email}
      company={profile.company}
    />
  );
}
