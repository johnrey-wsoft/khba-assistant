import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { PROTECTED_ROUTE_PATTERNS } from "@/constants/routes.constant";

export async function proxy(request: NextRequest) {
  return await updateSession(request, PROTECTED_ROUTE_PATTERNS);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/healthcheck (health check endpoint)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/healthcheck|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
