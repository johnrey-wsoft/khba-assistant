import type { Metadata } from "next";

import { guardOnboardingPage } from "@/lib/guards/member.guard";

import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Set up your account · KHBA Assistant",
};

export default async function OnboardingPage() {
  // Approved members skip onboarding; already-onboarded members go to /pending.
  await guardOnboardingPage();
  return <PageClient />;
}
