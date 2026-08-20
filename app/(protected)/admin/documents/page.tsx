import type { Metadata } from "next";

import { PageClient } from "./page.client";

// The /admin layout already guards the whole subtree (admins only).
export const metadata: Metadata = {
  title: "Documents · KHBA Assistant",
};

export default function AdminDocumentsPage() {
  return <PageClient />;
}
