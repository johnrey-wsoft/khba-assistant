import "server-only";

import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { User } from "@supabase/supabase-js";

import { profiles } from "@/drizzle/schemas";
import { db } from "@/lib/drizzle/db";
import { apiResponse } from "@/lib/response";
import { requireAuth } from "@/lib/guards/auth.guard";
import { getSupabaseServer } from "@/lib/supabase/server";

import { HttpStatus } from "@/constants/http-status.constant";
import { AUTH_ROUTES, PROTECTED_ROUTES } from "@/constants/routes.constant";
import { isApproved } from "@/constants/verification-status.constant";
import { isAdminRole } from "@/constants/access-role.constant";
import type { SelectProfile } from "@/types/drizzle.types";

// { user, profile } for the signed-in request, or null when unauthenticated.
// Used by the server-component page guards below.
export async function getServerProfile(): Promise<{
  user: User;
  profile: SelectProfile | null;
} | null> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  return { user, profile: profile ?? null };
}

// Page guard for the app proper (chat): must be signed in, onboarded, and
// approved. Admins (desk staff) bypass the member gates. Redirects to the right
// waypoint otherwise. Returns the profile.
export async function guardChatPage(): Promise<SelectProfile> {
  const sp = await getServerProfile();
  if (!sp) redirect(AUTH_ROUTES.LOGIN);
  if (isAdminRole(sp.profile?.accessRole)) return sp.profile!;
  if (!sp.profile?.onboardingCompleted) redirect(PROTECTED_ROUTES.ONBOARDING);
  if (!isApproved(sp.profile.verificationStatus)) redirect(PROTECTED_ROUTES.PENDING);
  return sp.profile;
}

// Page guard for /onboarding: approved members skip it; members already under
// review go to the pending screen. Rejected members are allowed back in to edit
// and resubmit. Admins never onboard.
export async function guardOnboardingPage(): Promise<SelectProfile | null> {
  const sp = await getServerProfile();
  if (!sp) redirect(AUTH_ROUTES.LOGIN);
  if (isAdminRole(sp.profile?.accessRole)) redirect(PROTECTED_ROUTES.CHAT);
  if (isApproved(sp.profile?.verificationStatus)) redirect(PROTECTED_ROUTES.CHAT);
  if (sp.profile?.onboardingCompleted && sp.profile.verificationStatus === "pending") {
    redirect(PROTECTED_ROUTES.PENDING);
  }
  return sp.profile;
}

// Page guard for /pending: only reachable after onboarding while not yet
// approved; approved members go to chat, un-onboarded members go to onboarding.
// Admins are never pending.
export async function guardPendingPage(): Promise<SelectProfile> {
  const sp = await getServerProfile();
  if (!sp) redirect(AUTH_ROUTES.LOGIN);
  if (isAdminRole(sp.profile?.accessRole)) redirect(PROTECTED_ROUTES.CHAT);
  if (!sp.profile?.onboardingCompleted) redirect(PROTECTED_ROUTES.ONBOARDING);
  if (isApproved(sp.profile.verificationStatus)) redirect(PROTECTED_ROUTES.CHAT);
  return sp.profile;
}

// Page guard for /admin: admins only. Non-admins are sent to chat.
export async function guardAdminPage(): Promise<SelectProfile> {
  const sp = await getServerProfile();
  if (!sp) redirect(AUTH_ROUTES.LOGIN);
  if (!isAdminRole(sp.profile?.accessRole)) redirect(PROTECTED_ROUTES.CHAT);
  return sp.profile!;
}

// API guard: authenticated + desk-approved. Mirrors requireAuth's { user, error }
// so it drops into route handlers: `const { user, error } = await requireApproved();`
export async function requireApproved(): Promise<{
  user: User | null;
  error: NextResponse | null;
}> {
  const { user, error } = await requireAuth();
  if (error) return { user: null, error };

  const [row] = await db
    .select({
      onboardingCompleted: profiles.onboardingCompleted,
      verificationStatus: profiles.verificationStatus,
      accessRole: profiles.accessRole,
    })
    .from(profiles)
    .where(eq(profiles.id, user!.id))
    .limit(1);

  // Admins bypass the member approval gate.
  if (isAdminRole(row?.accessRole)) return { user, error: null };

  if (!row?.onboardingCompleted || !isApproved(row.verificationStatus)) {
    return {
      user,
      error: apiResponse({
        status: HttpStatus.FORBIDDEN,
        message: "Account is awaiting association-desk approval",
      }),
    };
  }

  return { user, error: null };
}
