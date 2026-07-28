import { NextResponse } from "next/server";
import { User } from "@supabase/supabase-js";

import { apiResponse } from "@/lib/response";
import { getSupabaseServer } from "@/lib/supabase/server";

import { HttpStatus } from "@/constants/http-status.constant";

export async function requireAuth(): Promise<{
  user: User | null;
  error: NextResponse | null;
}> {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        user: null,
        error: apiResponse({
          status: HttpStatus.UNAUTHORIZED,
          message: authError?.message ?? "Unauthorized",
        }),
      };
    }

    return { user, error: null };
  } catch (error) {
    console.error("Auth verification failed:", error);
    return {
      user: null,
      error: apiResponse({
        status: HttpStatus.UNAUTHORIZED,
        message: "Unauthorized",
      }),
    };
  }
}
