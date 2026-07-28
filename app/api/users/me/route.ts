import { eq } from "drizzle-orm";

import { profiles } from "@/drizzle/schemas";
import { db } from "@/lib/drizzle/db";
import { apiResponse } from "@/lib/response";
import { rateLimit } from "@/lib/ratelimit";
import { requireAuth } from "@/lib/guards/auth.guard";

import { HttpStatus } from "@/constants/http-status.constant";

export async function GET() {
  try {
    const rateLimited = await rateLimit("api");
    if (rateLimited) return rateLimited;

    const { user, error } = await requireAuth();
    if (error) return error;

    const response = await db.select().from(profiles).where(eq(profiles.id, user!.id)).limit(1);

    return apiResponse({
      data: response[0] ?? null,
      status: HttpStatus.OK,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return apiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch user profile",
    });
  }
}
