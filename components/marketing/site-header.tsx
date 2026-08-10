"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { useRouter } from "nextjs-toploader/app";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { cn } from "@/lib/utils";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PUBLIC_ROUTES, AUTH_ROUTES, PROTECTED_ROUTES } from "@/constants/routes.constant";

const NAV = [
  { href: PUBLIC_ROUTES.ROOT, label: "Home" },
  { href: PUBLIC_ROUTES.ABOUT, label: "About us" },
  { href: PUBLIC_ROUTES.TERMS, label: "Terms of service" },
];

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export const SiteHeader = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [signingOut, startSignOut] = useTransition();

  const signOut = () =>
    startSignOut(async () => {
      await getSupabaseClient().auth.signOut();
      router.replace(PUBLIC_ROUTES.ROOT);
      router.refresh();
    });

  const displayName = profile?.name ?? user?.email ?? "Member";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
          <span className="grid size-8 place-items-center rounded-[10px] bg-primary text-sm font-extrabold text-primary-foreground shadow-sm">
            K
          </span>
          KHBA Assistant
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === PUBLIC_ROUTES.ROOT ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-bold transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <span className="flex-1" />

        {user ? (
          <div className="flex items-center gap-2.5">
            <Link
              href={PROTECTED_ROUTES.DASHBOARD}
              className="hidden items-center gap-2 rounded-full bg-accent py-1.5 pr-3.5 pl-1.5 text-sm font-bold text-accent-foreground sm:flex"
            >
              <span className="grid size-6 place-items-center rounded-full bg-primary text-[11px] font-extrabold text-primary-foreground">
                {initials(displayName)}
              </span>
              <span className="max-w-[12ch] truncate">{displayName}</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut} disabled={signingOut}>
              Sign out
            </Button>
            <ModeToggle />
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Link href={AUTH_ROUTES.LOGIN}>
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href={AUTH_ROUTES.REGISTER}>
              <Button size="sm">Sign up</Button>
            </Link>
            <ModeToggle />
          </div>
        )}
      </div>
    </header>
  );
};
