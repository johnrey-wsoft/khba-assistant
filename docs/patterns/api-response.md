# API Response

Consistent, standardized API responses across all endpoints.

## The Problem

Without standardization, endpoints return different response shapes and clients can't predict the format.

## How It Works

The `apiResponse()` helper in `lib/response.ts` provides:

- Automatic success/error detection from HTTP status code
- Consistent response shape across all endpoints
- Optional `message` field for additional context
- Type-safe with TypeScript generics

```typescript
// lib/response.ts
export function apiResponse<T>(prop: {
  data?: T | null;
  status: number;
  message?: string;
  headers?: Record<string, string>;
}): NextResponse {
  const { data, status, message, headers } = prop;
  const success = status >= 200 && status < 300;

  return NextResponse.json(
    {
      success,
      data: success ? (data ?? null) : null,
      ...(message ? { message } : {}),
      ...(success ? {} : { error: getStatusText(status) }),
    },
    { status, headers }
  );
}
```

## Response Format

**Success (2xx):**

```json
{
  "success": true,
  "data": { "id": "123", "email": "user@example.com" }
}
```

**Error (4xx/5xx):**

```json
{
  "success": false,
  "data": null,
  "error": "Unauthorized"
}
```

**Error with message:**

```json
{
  "success": false,
  "data": null,
  "error": "Bad Request",
  "message": "Missing required fields"
}
```

## Usage

### Success Response

```typescript
import { apiResponse } from "@/lib/response";
import { HttpStatus } from "@/constants/http-status.constant";

return apiResponse({
  data: profile,
  status: HttpStatus.OK,
});
```

### Error Response

```typescript
return apiResponse({
  status: HttpStatus.BAD_REQUEST,
  message: "Missing required fields",
});
```

### Complete Endpoint

```typescript
// app/api/users/me/route.ts
import { apiResponse } from "@/lib/response";
import { requireAuth } from "@/lib/guards/auth.guard";
import { HttpStatus } from "@/constants/http-status.constant";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const profile = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);

  return apiResponse({
    data: profile[0] ?? null,
    status: HttpStatus.OK,
  });
}
```

### Client-Side Handling

```typescript
// services/users.service.ts
export const usersService = {
  me: async (): Promise<SelectProfile | null> => {
    try {
      const response = await axiosInstance.get<{ data: SelectProfile | null }>(API_ROUTES.USERS.ME);
      return response.data.data ?? null;
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      return null;
    }
  },
};
```

## Related

- [HTTP Status →](./http-status.md) — Status codes and text mapping
- [Auth Guard →](./auth-guard.md) — Authentication verification
