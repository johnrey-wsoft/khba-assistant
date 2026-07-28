import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

import { apiResponse } from "@/lib/response";

import { HttpStatus } from "@/constants/http-status.constant";

// Tiers: api (20 req/10s), auth (5 req/60s), email (3 req/60s)
type RateLimitTier = "api" | "auth" | "email";

const TIERS = {
  api: Ratelimit.slidingWindow(20, "10s"),
  auth: Ratelimit.slidingWindow(5, "60s"),
  email: Ratelimit.slidingWindow(3, "60s"),
} as const;

const limiters = new Map<RateLimitTier, Ratelimit>();

function getLimiter(tier: RateLimitTier): Ratelimit {
  let limiter = limiters.get(tier);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: TIERS[tier],
    });
    limiters.set(tier, limiter);
  }
  return limiter;
}

// Returns a 429 response if rate limit exceeded, or null if allowed.
// Skips in development mode and when Upstash env vars are not set.
export async function rateLimit(
  tier: RateLimitTier,
  identifier?: string
): Promise<Response | null> {
  if (
    process.env.NODE_ENV === "development" ||
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "anonymous";

  const { success, limit, remaining, reset } = await getLimiter(tier).limit(identifier ?? ip);

  if (!success) {
    return apiResponse({
      status: HttpStatus.TOO_MANY_REQUESTS,
      message: "Too many requests. Please try again later.",
      headers: {
        "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(reset),
      },
    });
  }

  return null;
}
