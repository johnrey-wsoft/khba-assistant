"use client";

import { Search, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/components/chat/chat-store";
import { CHAT_THREADS, type ThreadStatus } from "@/constants/chat.constant";

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
            <span className="truncate text-sm font-bold text-foreground">KHBA Assistant</span>
            <span className="truncate text-xs text-muted-foreground">Member desk</span>
          </span>
        </div>

        <Button asChild className="w-full">
          <Link href="/chat" onClick={onNavigate}>
            <Plus />
            New consultation
          </Link>
        </Button>

        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="Search your threads"
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex items-baseline justify-between px-5 pt-4 pb-1">
        <span className="text-sm font-extrabold tracking-tight text-foreground">Consultations</span>
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
              No threads match “{filter}”.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
