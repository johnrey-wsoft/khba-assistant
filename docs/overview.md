---
outline: deep
---

# Getting Started

A production-ready template with Next.js 16, Supabase, Drizzle ORM, and TanStack Query. Clone, configure, and start building.

## Quick Start

```bash
pnpm install
cp .env.example .env
# Add your Supabase credentials (see Environment below)
pnpm db:push
# Apply the profiles trigger via Supabase SQL Editor (see Profiles trigger section)
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Environment

Required — get from your [Supabase project dashboard](https://supabase.com/dashboard):

```bash
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Optional services (leave empty to disable):

```bash
# Email (Resend)
RESEND_API_KEY=
RESEND_EMAIL_FROM=

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

> Rate limiting is automatically skipped in development mode.

## Local Development (Offline)

You can develop entirely offline using **Supabase Local Development** — no cloud account needed.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (must be running)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)

```bash
# Install Supabase CLI (macOS)
brew install supabase/tap/supabase
```

### Start Local Supabase

```bash
# Initialize Supabase in the project (first time only)
supabase init

# Start local Supabase services (auth, PostgreSQL, Studio, etc.)
supabase start
```

After `supabase start`, you'll see output like:

```text
API URL: http://127.0.0.1:54321
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
anon key: eyJhbG...
service_role key: eyJhbG...
Studio URL: http://127.0.0.1:54323
```

### Configure `.env`

Copy the values from `supabase start` output:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon key from output>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Leave `RESEND_*` and `UPSTASH_*` variables empty — they are optional:

- **Rate limiting** is automatically skipped in development mode (even if Upstash keys are set).
- **Email sending** returns a "not configured" response when Resend keys are missing.

### Push Schema & Run

```bash
pnpm db:push
pnpm dev
```

### What Works Locally

| Feature                      | Local Support | Notes                                 |
| ---------------------------- | ------------- | ------------------------------------- |
| Auth (email/password, OAuth) | ✅            | Full Supabase Auth via local instance |
| PostgreSQL CRUD              | ✅            | Drizzle ORM connects to local DB      |
| Rate limiting                | ⏭️ Skipped    | Disabled in development mode          |
| Email (Resend)               | ❌            | Requires cloud API key                |
| Drizzle Studio               | ✅            | `pnpm db:studio`                      |
| Supabase Studio              | ✅            | `http://127.0.0.1:54323`              |

### Stop Local Supabase

```bash
supabase stop
```

## Project Structure

### Route Groups

| Group         | Purpose                | Paths                                                        |
| ------------- | ---------------------- | ------------------------------------------------------------ |
| `(public)`    | Landing page           | `/`                                                          |
| `(auth)`      | Authentication         | `/login`, `/register`, `/forgot-password`, `/reset-password` |
| `(protected)` | App shell (auth-gated) | `/dashboard`                                                 |

Each group has its own layout and error boundary.

### Key Directories

```text
app/                    Next.js App Router
├── (auth)/             Auth pages with card layout
├── (protected)/        Dashboard with sidebar shell
├── (public)/           Marketing pages
└── api/                API endpoints

components/
├── ui/                 Shadcn/ui primitives (do not modify)
├── shared/             Reusable components
├── app-sidebar/        Sidebar navigation
└── providers/          Context providers

lib/
├── supabase/           Client + server Supabase setup
├── drizzle/            Database connection
├── guards/             Auth guard (requireAuth)
├── query/              React Query client + cache keys
├── response.ts         API response helper
├── ratelimit.ts        Rate limiting (Upstash)
└── seo.ts              Metadata helper

constants/              Routes, HTTP status, sidebar, SEO
schemas/                Zod validation schemas
services/               API client wrappers (Axios)
queries/                React Query option factories
hooks/                  Custom hooks (useAuth, useMobile)
drizzle/                Database schemas + migrations
tests/                  Unit (Vitest) + E2E (Playwright)
```

## Core Features

### Authentication

Pre-built auth flows with Zod validation (`schemas/auth.schema.ts`):

- **Login** (`/login`) — Email/password + GitHub/Google OAuth
- **Register** (`/register`) — Account creation, redirects to login
- **Forgot Password** (`/forgot-password`) — Request reset link
- **Reset Password** (`/reset-password`) — Complete the reset flow

All forms use `react-hook-form` with `zodResolver` for type-safe validation.

### Protected Routes

Middleware in `proxy.ts` enforces authentication:

```typescript
// constants/routes.constant.ts
export const PROTECTED_ROUTES = {
  DASHBOARD: "/dashboard",
} as const;
```

Add routes to `PROTECTED_ROUTES` — wildcard patterns are derived automatically. Unauthenticated users redirect to `/login`.

### API Layer

All API endpoints use `apiResponse()` for a consistent response format:

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

Response shape:

```json
// Success (2xx)
{ "success": true, "data": { ... } }

// Error (4xx/5xx)
{ "success": false, "data": null, "error": "Unauthorized" }
```

See [API Response Pattern →](./patterns/api-response) for details.

## Data Fetching

Three-layer pattern: **Service → Query Options → Component**

```typescript
// 1. Service — services/users.service.ts
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

// 2. Query Options — queries/user.query.ts
export const getUserQueryOptions = () =>
  queryOptions({
    queryKey: getQueryKey.users.me(),
    queryFn: () => usersService.me(),
  });

// 3. Component — use via useQuery or the useAuth hook
const { data: profile, isLoading } = useQuery(getUserQueryOptions());
```

See [Query Keys Pattern →](./patterns/query-keys) for cache management.

## Database

Drizzle ORM with PostgreSQL:

```typescript
// drizzle/schemas/profiles/profiles.schema.ts
export const profiles = pgTable("profiles", {
  ...baseColumns, // id, createdAt, updatedAt, deletedAt
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  imageUrl: varchar("image_url", { length: 255 }),
});
```

```bash
pnpm db:push              # Push schema to database
pnpm db:migrate <name>    # Generate migration
pnpm db:update            # Apply migrations
pnpm db:studio            # Visual editor
```

### Profiles trigger

The dashboard fetches the user's profile from the `profiles` table. A database trigger auto-creates a `profiles` row when a new user signs up. Since Drizzle ORM does not support triggers, you must **manually add this trigger** via the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql):

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, image_url)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'email',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

> **Note:** `pnpm db:push` only syncs tables and columns from your Drizzle TypeScript schemas — it does not create triggers or functions. You must apply the trigger separately after every `db:push`.

## Email (Resend)

Optional transactional email via the `/api/mail/send` endpoint. Requires `RESEND_API_KEY` and `RESEND_EMAIL_FROM` environment variables. Returns "Email service not configured" when keys are missing.

## SEO

Use `buildMetadata()` for consistent metadata across pages:

```typescript
import { buildMetadata } from "@/lib/seo";

// Root layout — uses defaults from constants/seo.constant.ts
export const metadata = buildMetadata();

// Per-page metadata
export const metadata = buildMetadata({
  title: "Dashboard",
  description: "Your dashboard",
  path: "/dashboard",
});
```

Generates Open Graph, Twitter cards, canonical URLs, and robots directives.

## Commands

```bash
# Development
pnpm dev                    # Dev server
pnpm build                  # Production build
pnpm start                  # Serve production build
pnpm start:all              # Dev + docs + Drizzle Studio

# Database
pnpm db:push                # Push schema
pnpm db:migrate <name>      # Generate migration
pnpm db:update              # Apply migrations
pnpm db:studio              # Visual editor

# Quality
pnpm lint                   # ESLint
pnpm lint:fix               # Auto-fix lint issues
pnpm format                 # Prettier

# Testing
pnpm test:unit              # Vitest
pnpm test:e2e               # Playwright
pnpm test:e2e:ui            # Playwright with UI

# Docs
pnpm docs:dev               # VitePress (port 4000)
pnpm docs:build             # Build docs
```

## Customization

1. **Set up Supabase** — Configure environment variables
2. **Update branding** — Edit `constants/seo.constant.ts` with your domain
3. **Customize navigation** — Edit `constants/app-sidebar-items.constant.ts`
4. **Add routes** — Create pages in the appropriate route group
5. **Extend schema** — Add tables in `drizzle/schemas/`
6. **Build features** — Follow the Service → Query → Component pattern

## Patterns

| Pattern           | Purpose                       | Link                                      |
| ----------------- | ----------------------------- | ----------------------------------------- |
| API Response      | Consistent endpoint responses | [Read more →](./patterns/api-response)    |
| Auth Guard        | Protect API routes            | [Read more →](./patterns/auth-guard)      |
| Form Validation   | Type-safe forms with Zod      | [Read more →](./patterns/form-validation) |
| Route Definitions | Centralized URL constants     | [Read more →](./patterns/routes)          |
| Query Keys        | React Query cache management  | [Read more →](./patterns/query-keys)      |
| HTTP Status       | Centralized status codes      | [Read more →](./patterns/http-status)     |

## Resources

| Resource                                           | Description                    |
| -------------------------------------------------- | ------------------------------ |
| [Next.js](https://nextjs.org/docs)                 | Framework documentation        |
| [Supabase](https://supabase.com/docs)              | Auth, database, and realtime   |
| [Drizzle ORM](https://orm.drizzle.team)            | Type-safe database queries     |
| [Shadcn/ui](https://ui.shadcn.com)                 | Component library              |
| [Origin UI](https://originui.com)                  | Shadcn-based UI components     |
| [tweakcn](https://tweakcn.com)                     | Visual theme editor for Shadcn |
| [Motion Primitives](https://motion-primitives.com) | Animated React components      |
| [Upstash](https://upstash.com)                     | Serverless Redis               |
