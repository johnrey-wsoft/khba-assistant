# NextBase

![NextBase Browser Image](/public/nextbase-template.png)

A production-ready full-stack starter built with **Next.js 16**, **Supabase**, **Drizzle ORM**, and **TypeScript**.

## Tech Stack

| Category        | Technology                                    |
| --------------- | --------------------------------------------- |
| Framework       | Next.js 16 (App Router), React 19, TypeScript |
| Auth & Database | Supabase (email/password, OAuth), PostgreSQL  |
| ORM             | Drizzle ORM (type-safe queries, migrations)   |
| UI              | Shadcn/ui, Radix, Tailwind CSS v4             |
| State           | TanStack React Query, Zustand                 |
| Forms           | react-hook-form, Zod                          |
| Testing         | Vitest (unit), Playwright (E2E)               |
| Docs            | VitePress                                     |
| Deploy          | Docker, GitHub Actions CI                     |

## Quick Start

```bash
pnpm install
cp .env.example .env
# Add your Supabase credentials (see Environment below)
pnpm db:push
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** The initial migration includes a database trigger that auto-creates a `profiles` row when a new user signs up. This is applied automatically when you run `pnpm db:push`. See the [Getting Started guide](./docs/overview.md) for details.

## Environment

Copy `.env.example` to `.env` and configure:

| Variable                               | Required | Source                                           |
| -------------------------------------- | -------- | ------------------------------------------------ |
| `DATABASE_URL`                         | Yes      | Supabase > Settings > Database                   |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | Supabase > Settings > API                        |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | Supabase > Settings > API                        |
| `NEXT_PUBLIC_SITE_URL`                 | —        | Defaults to `http://localhost:3000`              |
| `RESEND_API_KEY`                       | —        | [Resend](https://resend.com) for email           |
| `RESEND_EMAIL_FROM`                    | —        | Sender address                                   |
| `UPSTASH_REDIS_REST_URL`               | —        | [Upstash](https://upstash.com) for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN`             | —        | Upstash token                                    |

> **Offline development:** Run `supabase start` for a local Supabase instance. See the [full guide](./docs/overview.md#local-development-offline).

## Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm start                  # Serve production build
pnpm start:all              # Dev + docs + Drizzle Studio

# Database
pnpm db:push                # Push schema to database
pnpm db:migrate <name>      # Generate a migration
pnpm db:update              # Apply pending migrations
pnpm db:studio              # Open Drizzle Studio

# Quality
pnpm lint                   # ESLint
pnpm lint:fix               # Auto-fix lint issues
pnpm format                 # Prettier

# Testing
pnpm test:unit              # Vitest
pnpm test:e2e               # Playwright (Chromium, Firefox, WebKit)
pnpm test:e2e:ui            # Playwright with UI
pnpm test:e2e:debug         # Debug mode

# Documentation
pnpm docs:dev               # VitePress dev server (port 4000)
pnpm docs:build             # Build docs site
pnpm docs:preview           # Preview production docs
```

## Project Structure

```text
app/
├── (auth)/                 # Login, register, password reset
├── (protected)/            # Dashboard (auth-gated)
├── (public)/               # Landing page
└── api/                    # API endpoints
components/
├── ui/                     # Shadcn/ui primitives (do not modify)
├── shared/                 # Reusable components
├── app-sidebar/            # Sidebar shell
└── providers/              # Context providers
lib/
├── supabase/               # Auth + database clients
├── drizzle/                # ORM connection
├── guards/                 # Auth guard (requireAuth)
├── query/                  # React Query client + keys
├── response.ts             # API response helper
├── ratelimit.ts            # Rate limiting (Upstash)
└── seo.ts                  # Metadata helper
constants/                  # Routes, HTTP status, sidebar, SEO
schemas/                    # Zod validation schemas
services/                   # API client wrappers
queries/                    # React Query option factories
hooks/                      # Custom hooks
drizzle/                    # Database schemas + migrations
tests/                      # Unit + E2E tests
docs/                       # VitePress documentation
```

## Features

- **Authentication** — Email/password + OAuth (GitHub, Google), pre-built forms
- **Route Protection** — Middleware-based auth with automatic redirects
- **API Layer** — Consistent responses, auth guards, rate limiting
- **Database** — Drizzle ORM with migrations, studio, soft deletes
- **Sidebar Shell** — Collapsible navigation with user menu
- **Email** — Resend integration (optional)
- **SEO** — Metadata helper with Open Graph and Twitter cards
- **Rate Limiting** — Tiered Upstash Redis limits (optional, skipped in dev)
- **CI/CD** — GitHub Actions for lint, tests, and build
- **Docker** — Multi-stage production build (Node 22 Alpine)

## Documentation

```bash
pnpm docs:dev     # Start VitePress at http://localhost:4000
```

- **[Getting Started](./docs/overview.md)** — Setup, structure, core features
- **[Architecture Patterns](./docs/patterns/index.md)** — API response, auth guard, validation, routes, caching, status codes
- **[AGENTS.md](./AGENTS.md)** — Full developer reference

## Configuration

| File                          | Purpose                                     |
| ----------------------------- | ------------------------------------------- |
| `next.config.ts`              | Next.js (React Compiler, standalone output) |
| `tsconfig.json`               | TypeScript (strict mode)                    |
| `proxy.ts`                    | Route protection middleware                 |
| `components.json`             | Shadcn/ui configuration                     |
| `eslint.config.mjs`           | ESLint (flat config)                        |
| `.prettierrc`                 | Prettier formatting                         |
| `config/drizzle.config.ts`    | Drizzle ORM                                 |
| `config/playwright.config.ts` | Playwright E2E tests                        |
| `config/vitest.config.mts`    | Vitest unit tests                           |

## Resources

| Tool         | Link                                           |
| ------------ | ---------------------------------------------- |
| Next.js      | [nextjs.org/docs](https://nextjs.org/docs)     |
| Supabase     | [supabase.com/docs](https://supabase.com/docs) |
| Drizzle ORM  | [orm.drizzle.team](https://orm.drizzle.team)   |
| Shadcn/ui    | [ui.shadcn.com](https://ui.shadcn.com)         |
| Origin UI    | [originui.com](https://originui.com)           |
| tweakcn      | [tweakcn.com](https://tweakcn.com)             |
| Tailwind CSS | [tailwindcss.com](https://tailwindcss.com)     |
| Upstash      | [upstash.com](https://upstash.com)             |
