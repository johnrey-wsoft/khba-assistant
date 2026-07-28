import { buildMetadata } from "@/lib/seo";

import { PageClient } from "./page.client";

export const metadata = buildMetadata({
  title: "Login",
  description: "Sign in to your account.",
  path: "/login",
});

export default function Page() {
  return <PageClient />;
}
