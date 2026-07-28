# HTTP Status Codes

Centralized status codes and automatic text mapping for API responses.

## The Problem

Magic numbers scattered throughout your code create confusion:

```typescript
// ❌ Magic numbers everywhere
if (response.status === 401) {
  /* handle */
}
return NextResponse.json({}, { status: 500 });
toast.error("An error occurred"); // generic, unhelpful message
```

**Solution:** Centralize status codes and messages as constants.

## How It Works

All commonly-used HTTP status codes are defined as a single object:

```typescript
// constants/http-status.constant.ts
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;
```

## Status Text Mapping

Automatic text mapping for every status code:

```typescript
const STATUS_TEXT_MAP: Record<number, string> = {
  [HttpStatus.OK]: "OK",
  [HttpStatus.CREATED]: "Created",
  [HttpStatus.NO_CONTENT]: "No Content",
  [HttpStatus.BAD_REQUEST]: "Bad Request",
  [HttpStatus.UNAUTHORIZED]: "Unauthorized",
  [HttpStatus.FORBIDDEN]: "Forbidden",
  [HttpStatus.NOT_FOUND]: "Not Found",
  [HttpStatus.TOO_MANY_REQUESTS]: "Too Many Requests",
  [HttpStatus.INTERNAL_SERVER_ERROR]: "Internal Server Error",
};

export function getStatusText(status: number): string {
  return STATUS_TEXT_MAP[status] || "";
}
```

The `getStatusText()` function is used internally by `apiResponse()` to include proper HTTP status names in responses.

## Usage in API Routes

```typescript
import { HttpStatus } from "@/constants/http-status.constant";

return apiResponse({
  data: "Unauthorized",
  status: HttpStatus.UNAUTHORIZED,
});
```

## Usage in Client Components

```typescript
import { HttpStatus } from "@/constants/http-status.constant";

if (response.status === HttpStatus.UNAUTHORIZED) {
  // Handle 401
}
```

## Benefits

- **No magic numbers** — Named constants instead of `401`, `500` in code
- **Self-documenting** — `HttpStatus.UNAUTHORIZED` is clearer than `401`
- **Single source** — Update status text in one place

## Related

- [API Response](./api-response.md) — Response formatting
- [Auth Guard](./auth-guard.md) — Authentication verification
