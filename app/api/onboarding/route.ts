import { profiles } from "@/drizzle/schemas";
import { db } from "@/lib/drizzle/db";
import { apiResponse } from "@/lib/response";
import { rateLimit } from "@/lib/ratelimit";
import { requireAuth } from "@/lib/guards/auth.guard";

import { onboardingSchema } from "@/schemas/onboarding.schema";
import { CURRENT_TERMS_VERSION } from "@/constants/onboarding.constant";
import { HttpStatus } from "@/constants/http-status.constant";

// Save the member-onboarding details onto the signed-in user's profile and
// mark onboarding complete. No approval gate — the member goes straight to chat.
export async function POST(req: Request) {
  try {
    const rateLimited = await rateLimit("api");
    if (rateLimited) return rateLimited;

    const { user, error } = await requireAuth();
    if (error) return error;

    const parsed = onboardingSchema.safeParse(await req.json());
    if (!parsed.success) {
      return apiResponse({
        status: HttpStatus.BAD_REQUEST,
        message: "Invalid onboarding data",
      });
    }
    const values = parsed.data;

    // The onboarding fields, shared between insert and update paths.
    const onboardingFields = {
      name: values.name,
      company: values.company,
      // Store the registration number normalised to 10 digits.
      businessRegistrationNumber: values.businessRegistrationNumber.replace(/-/g, ""),
      memberNumber: values.memberNumber?.trim() || null,
      role: values.role,
      topics: values.topics,
      marketingOptIn: values.marketingOptIn,
      termsAcceptedAt: new Date(),
      termsVersion: CURRENT_TERMS_VERSION,
      onboardingCompleted: true,
      // Submitting onboarding files the account for association-desk review.
      // Setting it here (not just the column default) also re-opens review if a
      // previously rejected member resubmits.
      verificationStatus: "pending" as const,
    };

    // Upsert keyed on the auth user id. Normally the Supabase handle_new_user
    // trigger has already created the profile row (id = auth uid) and this just
    // updates it; but if that row is missing we create it here so onboarding
    // never dead-ends with "Profile not found".
    const [saved] = await db
      .insert(profiles)
      .values({
        id: user!.id,
        email: user!.email ?? "",
        ...onboardingFields,
      })
      .onConflictDoUpdate({ target: profiles.id, set: onboardingFields })
      .returning();

    return apiResponse({ data: saved, status: HttpStatus.OK });
  } catch (error) {
    console.error("[onboarding] failed to save:", error);
    return apiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to save onboarding",
    });
  }
}
