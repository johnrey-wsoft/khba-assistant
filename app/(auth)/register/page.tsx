import { buildMetadata } from "@/lib/seo";

import { PageClient } from "./page.client";

export const metadata = buildMetadata({
  title: "Register",
  description: "Create a new account.",
  path: "/register",
});

export default function Page() {
  return <PageClient />;
}
