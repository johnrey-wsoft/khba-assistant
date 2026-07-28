"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";

import { useAuth } from "@/hooks/use-auth";

const includes = [
  {
    label: "Framework",
    items: ["Next.js 16 (App Router, RSC)", "TypeScript 5.9 strict", "React 19"],
  },
  {
    label: "Backend",
    items: [
      "Supabase Auth + OAuth",
      "Drizzle ORM + Postgres",
      "Structured API routes + auth guards",
      "Rate limiting (Upstash Redis)",
      "Email sending (Resend)",
    ],
  },
  {
    label: "Frontend",
    items: [
      "Tailwind CSS v4",
      "Shadcn/ui (Radix)",
      "TanStack React Query",
      "react-hook-form + Zod",
    ],
  },
  {
    label: "Auth",
    items: [
      "Login, register, forgot & reset password",
      "Protected routes with session refresh",
      "Proxy-based middleware",
    ],
  },
  { label: "Testing", items: ["Vitest + Testing Library", "Playwright E2E (multi-browser)"] },
  {
    label: "Infra",
    items: [
      "Docker containerized",
      "GitHub Actions CI/CD",
      "ESLint + Prettier",
      "VitePress docs site",
    ],
  },
];

export const PageClient = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-mono text-sm">NextBase</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-4 text-sm">
              {user ? (
                <Link href="/dashboard">
                  <Button size="sm" variant="outline">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-muted-foreground hover:text-foreground transition"
                  >
                    Login
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Sign up</Button>
                  </Link>
                </>
              )}
            </div>
            <ModeToggle />
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Next.js + Supabase starter.
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mb-6">
            Auth, database, APIs, testing, and deploy — wired up and ready. Clone, build, ship.
          </p>

          <div className="rounded-md border border-border bg-muted/50 p-4 font-mono text-sm leading-relaxed mb-8">
            <p className="text-muted-foreground">
              <span className="select-none text-muted-foreground/50">$ </span>
              git clone https://github.com/wannacry081/nextjs-supabase-template
            </p>
            <p className="text-muted-foreground">
              <span className="select-none text-muted-foreground/50">$ </span>
              pnpm install
            </p>
            <p className="text-muted-foreground">
              <span className="select-none text-muted-foreground/50">$ </span>
              cp .env.example .env
            </p>
            <p className="text-muted-foreground">
              <span className="select-none text-muted-foreground/50">$ </span>
              pnpm dev
            </p>
          </div>

          <div className="flex gap-3 mb-16">
            <Link href={user ? "/dashboard" : "/register"}>
              <Button size="sm">{user ? "Dashboard" : "Get Started"}</Button>
            </Link>
            <Link
              href="https://github.com/wannacry081/nextjs-supabase-template"
              target="_blank"
              rel="noreferrer"
            >
              <Button size="sm" variant="ghost">
                GitHub &rarr;
              </Button>
            </Link>
          </div>

          <section>
            <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-6">
              What&apos;s included
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {includes.map((group) => (
                <div key={group.label}>
                  <h3 className="text-sm font-medium mb-2">{group.label}</h3>
                  <ul className="space-y-1">
                    {group.items.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-border py-6">
        <div className="max-w-2xl mx-auto px-4 text-xs text-muted-foreground flex justify-between">
          <span>&copy; {new Date().getFullYear()} WannaCry081</span>
          <Link
            href="https://github.com/wannacry081/nextjs-supabase-template"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition"
          >
            GitHub
          </Link>
        </div>
      </footer>
    </div>
  );
};
