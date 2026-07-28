---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "NextBase"
  text: "Starter Template"
  tagline: "Production-ready full-stack template with authentication, database, and deployment"
  image:
    src: logo.png
    alt: NextBase
  actions:
    - theme: brand
      text: Get Started
      link: /overview
    - theme: alt
      text: View Demo
      link: http://localhost:3000/

features:
  - title: Authentication
    details: Email/password + OAuth with pre-built login, register, and password reset flows
  - title: Route Protection
    details: Middleware-based session management with automatic redirects for protected routes
  - title: Database & ORM
    details: Drizzle ORM with PostgreSQL, type-safe queries, migrations, and Drizzle Studio
  - title: Component Library
    details: Shadcn/ui + Radix primitives with Tailwind CSS v4 and sidebar navigation shell
  - title: API Patterns
    details: Consistent response format, auth guards, rate limiting, and centralized error handling
  - title: Developer Experience
    details: TypeScript strict mode, ESLint, Prettier, Vitest, Playwright, Docker, and CI/CD
---
