# KHBA Assistant

A retrieval-augmented chat assistant for **KHBA** (Korea Housing Builders Association) members. Ask about a statute, ordinance, or notice in plain words and get a grounded answer — with the source document, the issuing authority, and its base date attached. Built by **W Labs**.

## Tech Stack

| Category        | Technology                                        |
| --------------- | ------------------------------------------------- |
| Framework       | Next.js 16 (App Router), React 19, TypeScript     |
| Auth & Database | Supabase (`@supabase/ssr`), PostgreSQL + pgvector |
| ORM             | Drizzle ORM (type-safe queries, migrations)       |
| AI / RAG        | Vercel AI SDK, OpenAI (embeddings + chat)         |
| UI              | Shadcn/ui, Radix, Tailwind CSS v4                 |
| i18n            | next-intl (Korean-first, English)                 |
| State           | TanStack React Query, Zustand                     |
| Forms           | react-hook-form, Zod                              |
| Testing         | Vitest (unit), Playwright (E2E)                   |
| Docs            | VitePress                                         |
| Deploy          | Docker Compose, GitHub Actions CI                 |

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
| `OPENAI_API_KEY`                       | Ingest   | Embeddings for the RAG pipeline                  |
| `LLAMA_CLOUD_API_KEY`                  | —        | Optional cloud OCR parser (fallback)             |
| `NEXT_PUBLIC_API_URL`                  | —        | `hwp-api` service URL (default `:8000`)          |
| `MARKITDOWN_API_URL`                   | —        | `markitdown-api` service URL (default `:8001`)   |
| `UPSTAGE_API_KEY`                      | —        | Optional cloud `.hwpx` parser (not wired in)     |

> R2 object-storage variables (`R2_*`) for raw source files and the full ingestion set are in `.env.example`.

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
├── (protected)/
│   ├── (member)/           # Chat + document search (member shell)
│   ├── admin/              # Admin: document management
│   ├── documents/[code]/   # Full-page document viewer
│   ├── onboarding/         # Member onboarding
│   └── pending/            # Awaiting desk approval
├── (public)/               # Marketing landing
└── api/                    # API routes (chat, documents, ingest, admin)
components/
├── ui/                     # Shadcn/ui primitives (do not modify)
├── chat/                   # Chat, citations, artifact + document viewers
├── admin/                  # Admin shell
├── shared/                 # Reusable wrappers
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

- **Grounded chat** — Answers cite the source document, authority, and base date; an artifact panel shows the original text alongside the answer
- **Document search** — Faceted search over the approved corpus (type, authority, region, period)
- **Document viewer** — Full-page viewer for the original file, linked from chat, search, and admin
- **Admin document management** — Upload, parse, re-index, and edit metadata for source documents
- **RAG ingestion** — Parse → semantic chunk → embed → pgvector, across self-hosted parser services (see below)
- **Onboarding + verification gate** — Members are approved by the association desk before access
- **Internationalization** — Korean-first with English, cookie-based via next-intl
- **Auth & RBAC** — Supabase auth with admin-gated routes and API guards
- **Rate limiting** — Tiered Upstash Redis limits (optional, skipped in dev)
- **CI/CD + Docker** — GitHub Actions and a multi-service `docker compose`

## Document ingestion (RAG)

Uploaded source documents (laws, ordinances, notices) are parsed to markdown, semantically chunked, embedded, and stored for retrieval. Parsing is routed by file type across self-hosted microservices defined in `docker-compose.yml`:

| Format                           | Parser                 | Service                                                 |
| -------------------------------- | ---------------------- | ------------------------------------------------------- |
| `.hwp`, `.hwpx`                  | hwplib / hwpxlib       | **`hwp-api`** — Java (`./java-hwp`) on `:8000`          |
| PDF, DOCX, PPTX, XLSX, images, … | Microsoft MarkItDown   | **`markitdown-api`** (`./python-markitdown`) on `:8001` |
| _(fallback)_                     | LlamaCloud agentic OCR | cloud (`LLAMA_CLOUD_API_KEY`)                           |

Run the parser services with Docker alongside the local app:

```bash
docker compose up -d hwp-api markitdown-api
pnpm dev
```

Embeddings use OpenAI (`OPENAI_API_KEY`); raw files are optionally stored in Cloudflare R2 (`R2_*`). `UPSTAGE_API_KEY` enables an optional cloud `.hwpx` parser, kept as a fallback but not wired into the pipeline. See [the ingestion requirements doc](./docs/requirements/khba-rag-document-requirements_en.md) for the full design.

## Documentation

```bash
pnpm docs:dev     # Start VitePress at http://localhost:4000
```

- **[Getting Started](./docs/overview.md)** — Setup, structure, core features
- **[RAG Implementation](./docs/implementation/khba-rag.en.md)** — Ingestion pipeline, retrieval, chat
- **[Document Requirements & API Plan](./docs/requirements/khba-rag-document-requirements_en.md)** — HWP/HWPX parsing decisions, API surface
- **[Architecture Patterns](./docs/patterns/index.md)** — API response, auth guard, validation, routes, caching
- **[CLAUDE.md](./CLAUDE.md)** · **[AGENTS.md](./AGENTS.md)** — Developer reference

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
