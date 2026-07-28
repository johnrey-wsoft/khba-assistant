import { buildMetadata } from "@/lib/seo";

import { PageClient } from "./page.client";

export const metadata = buildMetadata({
  title: "Reset Password",
  description: "Set a new password for your account.",
  path: "/reset-password",
});

export default function Page() {
  return <PageClient />;
}
