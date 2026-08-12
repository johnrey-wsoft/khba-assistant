import { eq } from "drizzle-orm";

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

    const updated = await db
      .update(profiles)
      .set({
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
      })
      .where(eq(profiles.id, user!.id))
      .returning();

    if (updated.length === 0) {
      return apiResponse({ status: HttpStatus.NOT_FOUND, message: "Profile not found" });
    }

    return apiResponse({ data: updated[0], status: HttpStatus.OK });
  } catch (error) {
    console.error("[onboarding] failed to save:", error);
    return apiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to save onboarding",
    });
  }
}
