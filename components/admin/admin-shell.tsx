"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Users, FileText, ArrowLeft, LogOut, PanelLeft, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { LocaleSwitcher } from "@/components/marketing/locale-switcher";
import { cn } from "@/lib/utils";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { PUBLIC_ROUTES, PROTECTED_ROUTES } from "@/constants/routes.constant";

const initials = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

type AdminShellProps = PropsWithChildren<{ name: string; email: string }>;

export const AdminShell = ({ name, email, children }: AdminShellProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [signingOut, startSignOut] = useTransition();
  const isMobile = useIsMobile();
  // Desktop keeps the sidebar open by default; the mobile drawer starts closed.
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // One navbar trigger, routed by viewport: drawer on mobile, collapsible
  // column on desktop.
  const toggleSidebar = () => {
    if (isMobile) setMobileOpen((v) => !v);
    else setDesktopOpen((v) => !v);
  };

  // Nav items — extend this as admin routes are added.
  const nav: { href: string; label: string; description: string; icon: LucideIcon }[] = [
    {
      href: PROTECTED_ROUTES.ADMIN,
      label: t("navMembers"),
      description: t("subtitle"),
      icon: Users,
    },
    {
      href: `${PROTECTED_ROUTES.ADMIN}/documents`,
      label: t("navDocuments"),
      description: t("docsSubtitle"),
      icon: FileText,
    },
  ];

  // The current section, shown as the top navbar title + description.
  const active = nav.find((item) => item.href === pathname);
  const activeLabel = active?.label ?? t("consoleTitle");
  const activeDescription = active?.description ?? "";

  const signOut = () =>
    startSignOut(async () => {
      await getSupabaseClient().auth.signOut();
      router.replace(PUBLIC_ROUTES.ROOT);
      router.refresh();
    });

  // Close the mobile drawer on Escape.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const displayName = name || email;

  const sidebar = (
    <div className="flex h-full w-full flex-col border-r border-border bg-card">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-border p-4">
        <span className="grid size-[34px] flex-none place-items-center rounded-[9px] bg-[linear-gradient(150deg,var(--navy),var(--navy-3))] text-[17px] leading-none font-extrabold text-white shadow-sm">
          近
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-bold text-foreground">{tc("appName")}</span>
          <span className="truncate text-xs text-muted-foreground">{t("consoleTitle")}</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2.5">
        {nav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold tracking-tight transition-colors",
                active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer — back to chat + account controls */}
      <div className="flex flex-col gap-2.5 border-t border-border p-3">
        <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2">
          <Link href={PROTECTED_ROUTES.CHAT} onClick={() => setMobileOpen(false)}>
            <ArrowLeft className="size-4" />
            {t("backToChat")}
          </Link>
        </Button>
        <div className="flex items-center gap-2.5 px-1">
          <span className="grid size-8 flex-none place-items-center rounded-full bg-primary text-[11px] font-extrabold text-primary-foreground">
            {initials(displayName)}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">
            {displayName}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            disabled={signingOut}
            title={tc("signOut")}
            aria-label={tc("signOut")}
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-svh min-w-0 overflow-hidden bg-muted/40">
      {/* Desktop: collapsible sidebar column */}
      <div className={cn("hidden w-64 flex-none md:block", !desktopOpen && "md:hidden")}>
        {sidebar}
      </div>

      {/* Mobile: slide-in drawer */}
      {mobileOpen && (
        <div className="md:hidden">
          <div
            onClick={() => setMobileOpen(false)}
            aria-hidden
            className="fixed inset-0 z-40 bg-black/50 duration-200 animate-in fade-in"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] shadow-xl duration-200 animate-in slide-in-from-left-4 fade-in">
            {sidebar}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top navbar — section title, plus the drawer toggle on mobile */}
        <header className="flex flex-none items-center gap-2.5 border-b border-border bg-card/85 px-4 py-3 backdrop-blur sm:px-6">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSidebar}
            title={t("toggleSidebar")}
            aria-label={t("toggleSidebar")}
          >
            <PanelLeft />
          </Button>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-base font-extrabold tracking-tight text-foreground">
              {activeLabel}
            </span>
            {activeDescription && (
              <span className="truncate text-xs text-muted-foreground">{activeDescription}</span>
            )}
          </div>
          <span className="flex-1" />
          <LocaleSwitcher />
          <ModeToggle />
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
