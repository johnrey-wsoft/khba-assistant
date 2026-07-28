import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_UNAUTH_REDIRECT } from "@/constants/routes.constant";

/**
 * Updates session and handles route protection
 * @param request - Next.js request object
 * @param protectedRoutes - Array of protected route patterns
 * @returns Next.js response with updated cookies
 */
export async function updateSession(request: NextRequest, protectedRoutes: string[]) {
  const response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const pathname = request.nextUrl.pathname;

  const isProtected = protectedRoutes.some((pattern) => {
    if (pattern.endsWith("/*")) {
      const base = pattern.slice(0, -2);
      return pathname === base || pathname.startsWith(`${base}/`);
    }
    return pathname === pattern || pathname.startsWith(`${pattern}/`);
  });

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = DEFAULT_UNAUTH_REDIRECT;
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
