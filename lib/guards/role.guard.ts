import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { User } from "@supabase/supabase-js";

import { profiles } from "@/drizzle/schemas";
import { db } from "@/lib/drizzle/db";
import { apiResponse } from "@/lib/response";
import { requireAuth } from "@/lib/guards/auth.guard";

import { HttpStatus } from "@/constants/http-status.constant";
import type { AccessRole } from "@/constants/access-role.constant";

// The signed-in user's access role (null if the profile row is missing).
export async function getAccessRole(userId: string): Promise<AccessRole | null> {
  const [row] = await db
    .select({ accessRole: profiles.accessRole })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return row?.accessRole ?? null;
}

// Gate an API route on one of the given roles. Builds on requireAuth, so it
// returns the same { user, error } shape (plus the resolved role) and can be
// used identically: `const { user, error } = await requireRole("admin");`.
export async function requireRole(...roles: AccessRole[]): Promise<{
  user: User | null;
  role: AccessRole | null;
  error: NextResponse | null;
}> {
  const { user, error } = await requireAuth();
  if (error) return { user: null, role: null, error };

  const role = await getAccessRole(user!.id);

  if (!role || !roles.includes(role)) {
    return {
      user,
      role,
      error: apiResponse({ status: HttpStatus.FORBIDDEN, message: "Forbidden" }),
    };
  }

  return { user, role, error: null };
}

// Convenience wrapper for admin-only routes.
export const requireAdmin = () => requireRole("admin");
