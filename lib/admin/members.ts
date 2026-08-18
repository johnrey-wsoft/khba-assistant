import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/drizzle/db";
import { profiles } from "@/drizzle/schemas";
import type { AdminMember, AdminMemberPatch } from "@/lib/admin/types";

// Column projection shared by list + update, so both return the same shape.
const MEMBER_COLUMNS = {
  id: profiles.id,
  name: profiles.name,
  email: profiles.email,
  company: profiles.company,
  accessRole: profiles.accessRole,
  verificationStatus: profiles.verificationStatus,
  createdAt: profiles.createdAt,
};

// All members, newest first.
export const listMembers = (): Promise<AdminMember[]> =>
  db.select(MEMBER_COLUMNS).from(profiles).orderBy(desc(profiles.createdAt));

// Apply a verification-status / access-role change to one member. Returns the
// updated row, or null if no member matched.
export const updateMember = async (
  id: string,
  patch: AdminMemberPatch
): Promise<AdminMember | null> => {
  const [row] = await db
    .update(profiles)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(profiles.id, id))
    .returning(MEMBER_COLUMNS);

  return row ?? null;
};
