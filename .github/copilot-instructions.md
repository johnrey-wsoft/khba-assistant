# Copilot Instructions — NextBase (Next.js + Supabase + Drizzle)

> Deep reference: see [AGENTS.md](../AGENTS.md) for component hierarchy, state management patterns, Supabase integration, error handling, and full project structure.

## Quick Start

```bash
pnpm install
cp .env.example .env          # fill in DATABASE_URL, SUPABASE_URL, SUPABASE_KEY
pnpm db:push                  # apply schema to database
pnpm dev                      # http://localhost:3000
```

## Commands

| Task                           | Command                            |
| ------------------------------ | ---------------------------------- |
| Dev server                     | `pnpm dev`                         |
| Build                          | `pnpm build`                       |
| Lint                           | `pnpm lint` (fix: `pnpm lint:fix`) |
| Format                         | `pnpm format`                      |
| Unit tests                     | `pnpm test:unit`                   |
| E2E tests                      | `pnpm test:e2e`                    |
| DB push schema                 | `pnpm db:push`                     |
| DB generate migration          | `pnpm db:migrate <name>`           |
| DB apply migrations            | `pnpm db:update`                   |
| DB studio                      | `pnpm db:studio`                   |
| Docs dev                       | `pnpm docs:dev`                    |
| All parallel (app+docs+studio) | `pnpm start:all`                   |

## Tech Stack

Next.js 16 (App Router) · React 19 · TypeScript 5.9 (strict) · Supabase Auth + SSR · Drizzle ORM + PostgreSQL · TanStack React Query 5 · react-hook-form + Zod 4 · Tailwind CSS v4 · Shadcn/ui (Radix) · Vitest + Playwright · pnpm

## Architecture — What Matters

### Route Groups

| Group              | URL examples                                                 | Layout        | Auth                  |
| ------------------ | ------------------------------------------------------------ | ------------- | --------------------- |
| `app/(public)/`    | `/`                                                          | Root layout   | None                  |
| `app/(auth)/`      | `/login`, `/register`, `/forgot-password`, `/reset-password` | Centered card | None                  |
| `app/(protected)/` | `/dashboard/*`                                               | Sidebar shell | Required (middleware) |

### Server/Client Split (mandatory for interactive pages)

```text
app/(auth)/login/page.tsx         ← Server Component (thin entry, metadata)
app/(auth)/login/page.client.tsx  ← "use client" (forms, hooks, state)
```

### Data Fetching Flow

```text
Service (services/*.service.ts)     → axios wrapper, isolates errors, returns typed data or null
  ↓
Query Options (queries/*.query.ts)  → TanStack queryOptions with hierarchical keys
  ↓
Component (useQuery or useAuth)     → consumes query options, renders data
```

### Route Protection

Middleware in `proxy.ts` → `lib/supabase/middleware.ts` → uses `getClaims()` (not `getUser()`) for performance. Add protected routes to `PROTECTED_ROUTES` in `constants/routes.constant.ts`.

### API Route Pattern

```typescript
// 1. Rate limit (optional)
const rateLimitError = await rateLimit("api", identifier);
if (rateLimitError) return rateLimitError;

// 2. Auth guard
const { user, error } = await requireAuth();
if (error) return error;

// 3. Business logic + structured response
return apiResponse({ status: 200, data: result });
```

All responses use `apiResponse()` from `lib/response.ts` → `{ success, data, error?, message? }`.

### Component Hierarchy

```text
components/ui/       → Shadcn/Radix primitives — DO NOT MODIFY
components/shared/   → Reusable wrappers (imports from ui/ only)
components/app-sidebar/ & future components/features/*  → Domain-specific
components/providers/ → React context providers (registered in root layout)
```

## Coding Standards

### File Naming — kebab-case for ALL files

| Category      | Pattern              | Example                                       |
| ------------- | -------------------- | --------------------------------------------- |
| Components    | `component-name.tsx` | `password-input.tsx`                          |
| Client pages  | `page.client.tsx`    | `app/(auth)/login/page.client.tsx`            |
| Hooks         | `use-hook-name.ts`   | `hooks/use-auth.ts`                           |
| Services      | `name.service.ts`    | `services/users.service.ts`                   |
| Query options | `name.query.ts`      | `queries/user.query.ts`                       |
| Constants     | `name.constant.ts`   | `constants/seo.constant.ts`                   |
| DB schemas    | `name.schema.ts`     | `drizzle/schemas/profiles/profiles.schema.ts` |
| Zod schemas   | `name.schema.ts`     | `schemas/auth.schema.ts`                      |
| Types         | `name.types.ts`      | `types/drizzle.types.ts`                      |

### Import Order (separated by blank lines)

1. React/Next.js core
2. Third-party libraries
3. Internal utilities and lib (`@/lib/*`)
4. Services, queries, hooks (`@/services/*`, `@/queries/*`, `@/hooks/*`)
5. Components (ui → shared → feature-specific)
6. Types (`import type`)
7. Styles

### TypeScript

- No `any` — use `unknown` + type guards to narrow
- `interface` for object shapes; `type` for unions/intersections
- `const` by default; `let` only when reassignment needed
- `import type` for type-only imports
- Always type function parameters and return types for public APIs

### React

- Functional components + hooks only; no class components
- `"use client"` only when component needs interactivity, hooks, or browser APIs
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes
- Every form input needs an associated `<label>`; use semantic HTML
- Use `useTransition` for async form submissions with `isPending` for button state

### Error Handling

**Client (forms):** Two-level pattern — `if (error)` for expected errors (Supabase auth failures) + `catch` for unexpected errors. Use `toast.error()` / `toast.success()` from sonner.

**API routes:** Try/catch → `apiResponse()` with proper status codes. Never leak stack traces. `console.error()` before returning generic 500.

**Services:** Wrap in try/catch, return `null` on failure — errors isolated from query layer.

### Formatting

Prettier: semicolons, double quotes, trailing commas `es5`, 100 char width.

## Environment Variables

| Variable                               | Required | Purpose                                       |
| -------------------------------------- | -------- | --------------------------------------------- |
| `DATABASE_URL`                         | Yes      | PostgreSQL connection string                  |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | Supabase project URL                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | Supabase anon key                             |
| `NEXT_PUBLIC_SITE_URL`                 | No       | App URL (defaults to `http://localhost:3000`) |
| `RESEND_API_KEY`                       | No       | Email sending (Resend)                        |
| `RESEND_EMAIL_FROM`                    | No       | Sender email address                          |
| `UPSTASH_REDIS_REST_URL`               | No       | Rate limiting (Upstash Redis)                 |
| `UPSTASH_REDIS_REST_TOKEN`             | No       | Rate limiting token                           |

Optional services degrade gracefully when env vars are not set.

## Database (Drizzle ORM)

- Schemas: `drizzle/schemas/` — all tables extend `baseColumns` (id, createdAt, updatedAt, deletedAt)
- Migrations: `drizzle/migrations/` — generated SQL files
- Connection: `lib/drizzle/db.ts` — postgres.js with `prepare: false` for Supabase pooling
- Types: `types/drizzle.types.ts` — inferred `Select*` and `Insert*` types
- Workflow: edit schema → `pnpm db:migrate <name>` → `pnpm db:update` → update types/services

## Testing

- **Unit:** Vitest + jsdom + Testing Library (`tests/unit/`). Run: `pnpm test:unit`
- **E2E:** Playwright (Chromium, Firefox, WebKit) with auto-start dev server (`tests/e2e/`). Run: `pnpm test:e2e`
- Prefer `getByRole`, `getByLabelText`, `getByTestId` selectors; avoid deep CSS selectors
- Rely on Playwright auto-waiting; no `waitForTimeout()`

## Adding a New Feature

1. Choose route group: `(public)`, `(auth)`, or `(protected)`
2. Create `page.tsx` (server entry + metadata) + `page.client.tsx` (client logic)
3. If data needed: add API route → service → query options
4. If protected: add to `PROTECTED_ROUTES` in `constants/routes.constant.ts`
5. If sidebar nav: update `constants/app-sidebar-items.constant.ts`
6. Add tests in `tests/unit/` or `tests/e2e/`
7. New env vars → `.env.example` + `types/globals/env.d.ts`

## Pre-Commit Checklist

- [ ] `pnpm lint` passes
- [ ] `pnpm test:unit` passes
- [ ] `pnpm build` passes
- [ ] `pnpm test:e2e` for UI/routing/auth changes
- [ ] No `any` types
- [ ] All files kebab-case
- [ ] Conventional commit message (`feat:`, `fix:`, `refactor:`, etc.)

## Pitfalls

- **"Always redirected to /login"** — route matches `PROTECTED_ROUTE_PATTERNS`; check session in middleware
- **"Profile data null in sidebar"** — `/api/users/me` needs matching `profiles` row in DB
- **"Build env errors"** — verify required env vars in `.env` and CI secrets
- **"Playwright fails locally"** — run `pnpm exec playwright install --with-deps` first
- **Don't modify `components/ui/`** — wrap or extend in `components/shared/` instead
- **Don't use `supabase.auth.getUser()` in middleware** — use `getClaims()` for performance
