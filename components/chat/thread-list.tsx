"use client";

import { Search, Plus, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useChatStore } from "@/components/chat/chat-store";
import { CHAT_THREADS, type ThreadStatus } from "@/constants/chat.constant";
import { PUBLIC_ROUTES, PROTECTED_ROUTES } from "@/constants/routes.constant";

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const STATUS_DOT: Record<ThreadStatus, string> = {
  sourced: "bg-chart-2",
  partial: "bg-chart-3",
  unanswered: "bg-destructive",
};

type ThreadItem = {
  id: string;
  title: string;
  preview: string;
  when: string;
  status: ThreadStatus;
};

type ThreadListProps = {
  activeId: string | null;
  filter: string;
  onFilterChange: (value: string) => void;
  // Fired when a link is followed — lets the mobile drawer close on navigation.
  onNavigate?: () => void;
};

export const ThreadList = ({ activeId, filter, onFilterChange, onNavigate }: ThreadListProps) => {
  const { conversations } = useChatStore();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [signingOut, startSignOut] = useTransition();
  const t = useTranslations("common");
  const tc = useTranslations("chat");

  const signOut = () =>
    startSignOut(async () => {
      await getSupabaseClient().auth.signOut();
      router.replace(PUBLIC_ROUTES.ROOT);
      router.refresh();
    });

  const displayName = profile?.name ?? user?.email ?? t("member");

  // Live conversations started this session, then the sample threads.
  const items: ThreadItem[] = [
    ...conversations.map((c) => ({
      id: c.id,
      title: c.title,
      preview: c.preview,
      when: c.when,
      status: "sourced" as ThreadStatus,
    })),
    ...CHAT_THREADS,
  ];

  const q = filter.trim().toLowerCase();
  const threads = q
    ? items.filter((t) => t.title.toLowerCase().includes(q) || t.preview.toLowerCase().includes(q))
    : items;

  return (
    <section className="flex h-full min-w-0 flex-col overflow-hidden border-r border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="grid size-8 flex-none place-items-center rounded-lg bg-primary text-sm font-extrabold text-primary-foreground shadow-sm"
          >
            K
          </Link>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold text-foreground">{t("appName")}</span>
            <span className="truncate text-xs text-muted-foreground">{tc("brandSub")}</span>
          </span>
        </div>

        <Button asChild className="w-full">
          <Link href={PROTECTED_ROUTES.CHAT} onClick={onNavigate}>
            <Plus />
            {tc("newConsultation")}
          </Link>
        </Button>

        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder={tc("searchThreads")}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex items-baseline justify-between px-5 pt-4 pb-1">
        <span className="text-sm font-extrabold tracking-tight text-foreground">
          {tc("consultations")}
        </span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{items.length}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-0.5 p-2.5">
          {threads.map((t) => (
            <Link
              key={t.id}
              href={`/chat/${t.id}`}
              onClick={onNavigate}
              className={cn(
                "flex w-full min-w-0 flex-col gap-1 rounded-2xl px-3.5 py-3 text-left transition-colors",
                activeId === t.id ? "bg-accent" : "hover:bg-muted"
              )}
            >
              <span className="flex items-center gap-2">
                <span className={cn("size-2 flex-none rounded-full", STATUS_DOT[t.status])} />
                <span className="min-w-0 flex-1 truncate text-sm font-bold tracking-tight text-foreground">
                  {t.title}
                </span>
              </span>
              <span className="truncate text-sm text-muted-foreground">{t.preview}</span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">{t.when}</span>
            </Link>
          ))}

          {threads.length === 0 && (
            <p className="px-3.5 py-6 text-center text-sm text-muted-foreground">
              {tc("noThreads", { filter })}
            </p>
          )}
        </div>
      </div>

      {/* Account controls — theme, language, and sign out. */}
      <div className="flex flex-col gap-2.5 border-t border-border p-3">
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
            title={t("signOut")}
            aria-label={t("signOut")}
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </section>
  );
};
