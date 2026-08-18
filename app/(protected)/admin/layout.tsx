import type { PropsWithChildren } from "react";

import { guardAdminPage } from "@/lib/guards/member.guard";
import { AdminShell } from "@/components/admin/admin-shell";

// Guards every /admin route (admins only) and wraps them in the sidebar shell.
export default async function AdminLayout({ children }: PropsWithChildren) {
  const profile = await guardAdminPage();
  return (
    <AdminShell name={profile.name} email={profile.email}>
      {children}
    </AdminShell>
  );
}
