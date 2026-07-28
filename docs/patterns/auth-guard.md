# Auth Guard

Centralize authentication checks for all protected API endpoints.

## The Problem

Without a centralized guard, auth logic gets duplicated in every endpoint.

## How It Works

```typescript
// lib/guards/auth.guard.ts
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
```

## Usage

```typescript
// app/api/users/me/route.ts
import { requireAuth } from "@/lib/guards/auth.guard";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  // user is guaranteed to be defined here
  const profile = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);

  return apiResponse({
    data: profile[0] ?? null,
    status: HttpStatus.OK,
  });
}
```

## Key Points

- **Single function** for all auth checks — no duplication
- **Error already formatted** — return `error` directly as the response
- **Type-safe** — `user` is guaranteed non-null after the guard check
- **Logs failures** — `console.error` for debugging unexpected auth errors

## Related

- [API Response →](./api-response.md) — Response formatting
- [Route Definitions →](./routes.md) — Protected route constants
