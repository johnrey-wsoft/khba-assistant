import type { Metadata } from "next";

import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Set up your account · KHBA Assistant",
};

export default function OnboardingPage() {
  return <PageClient />;
}
