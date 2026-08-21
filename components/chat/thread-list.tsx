"use client";

import { useState, useTransition } from "react";
import {
  Search,
  Plus,
  LogOut,
  MoreHorizontal,
  Pencil,
  Trash2,
  ShieldCheck,
  Library,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useChatStore } from "@/components/chat/chat-store";
import { getChatsQueryOptions } from "@/queries/chat.query";
import { chatsService } from "@/services/chats.service";
import { getQueryKey } from "@/lib/query/get-query-keys";
import { formatWhen } from "@/lib/chat/session";
import { type ThreadStatus } from "@/constants/chat.constant";
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
  // Persisted chats can be renamed/deleted; session-only ones can't yet.
  canManage: boolean;
};

type ThreadListProps = {
  activeId: string | null;
  filter: string;
  onFilterChange: (value: string) => void;
  // Fired when a link is followed — lets the mobile drawer close on navigation.
  onNavigate?: () => void;
};

export const ThreadList = ({ activeId, filter, onFilterChange, onNavigate }: ThreadListProps) => {
  const { conversations, setConversationTitle, removeConversation } = useChatStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, profile, isAdmin, isLoading: authLoading } = useAuth();
  const [signingOut, startSignOut] = useTransition();
  const t = useTranslations("common");
  const tc = useTranslations("chat");
  const pathname = usePathname();
  const onSearch = pathname?.startsWith(PROTECTED_ROUTES.SEARCH) ?? false;

  // Persisted chats for the signed-in user (source of truth for the sidebar).
  const { data: persistedChats = [], isLoading: chatsLoading } = useQuery({
    ...getChatsQueryOptions(),
    enabled: !!user,
  });

  // Show skeletons while auth resolves or the first chats fetch is in flight,
  // so an empty state isn't flashed before the list arrives.
  const loadingThreads = authLoading || chatsLoading;

  // Rename / delete dialog targets (null = closed).
  const [renameTarget, setRenameTarget] = useState<ThreadItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ThreadItem | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getQueryKey.chats.all });

  const renameMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const ok = await chatsService.rename(id, title);
      if (!ok) throw new Error("rename failed");
    },
    onSuccess: (_data, { id, title }) => {
      setConversationTitle(id, title);
      invalidate();
      setRenameTarget(null);
      toast.success(tc("renamed"));
    },
    onError: () => toast.error(tc("actionError")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const ok = await chatsService.remove(id);
      if (!ok) throw new Error("delete failed");
    },
    onSuccess: (_data, id) => {
      removeConversation(id);
      invalidate();
      setDeleteTarget(null);
      toast.success(tc("deleted"));
      // Leaving the open chat that was just deleted -> back to a fresh chat.
      if (activeId === id) router.push(PROTECTED_ROUTES.CHAT);
    },
    onError: () => toast.error(tc("actionError")),
  });

  const signOut = () =>
    startSignOut(async () => {
      await getSupabaseClient().auth.signOut();
      router.replace(PUBLIC_ROUTES.ROOT);
      router.refresh();
    });

  const displayName = profile?.name ?? user?.email ?? t("member");

  // Persisted chats first, then session-only conversations not yet persisted.
  // Deduped by id.
  const persistedItems: ThreadItem[] = persistedChats.map((c) => ({
    id: c.id,
    title: c.title ?? tc("newConsultation"),
    preview: c.preview,
    when: formatWhen(c.updatedAt),
    status: "sourced" as ThreadStatus,
    canManage: true,
  }));

  const persistedIds = new Set(persistedItems.map((i) => i.id));

  const sessionItems: ThreadItem[] = conversations
    .filter((c) => !persistedIds.has(c.id))
    .map((c) => ({
      id: c.id,
      title: c.title,
      preview: c.preview,
      when: c.when,
      status: "sourced" as ThreadStatus,
      canManage: false,
    }));

  const items: ThreadItem[] = [...persistedItems, ...sessionItems];

  const q = filter.trim().toLowerCase();
  const threads = q
    ? items.filter((t) => t.title.toLowerCase().includes(q) || t.preview.toLowerCase().includes(q))
    : items;

  const openRename = (item: ThreadItem) => {
    setRenameValue(item.title);
    setRenameTarget(item);
  };

  const submitRename = (e: React.FormEvent) => {
    e.preventDefault();
    const title = renameValue.trim();
    if (!renameTarget || !title || renameMutation.isPending) return;
    renameMutation.mutate({ id: renameTarget.id, title });
  };

  return (
    <section className="flex h-full min-w-0 flex-col overflow-hidden border-r border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            aria-label={t("appName")}
            className="grid size-[34px] flex-none place-items-center rounded-[9px] bg-[linear-gradient(150deg,var(--navy),var(--navy-3))] text-[17px] leading-none font-extrabold text-white shadow-sm"
          >
            近
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
          {loadingThreads &&
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`thread-skeleton-${i}`}
                className="flex flex-col gap-2 rounded-2xl px-3.5 py-3"
              >
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          {!loadingThreads &&
            threads.map((thread) => (
              <div key={thread.id} className="group relative">
                <Link
                  href={`/chat/${thread.id}`}
                  onClick={onNavigate}
                  className={cn(
                    "flex w-full min-w-0 flex-col gap-1 rounded-2xl px-3.5 py-3 text-left transition-colors",
                    activeId === thread.id ? "bg-accent" : "hover:bg-muted"
                  )}
                >
                  <span className="flex items-center gap-2 pr-7">
                    <span
                      className={cn("size-2 flex-none rounded-full", STATUS_DOT[thread.status])}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold tracking-tight text-foreground">
                      {thread.title}
                    </span>
                  </span>
                  <span className="truncate text-sm text-muted-foreground">{thread.preview}</span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {thread.when}
                  </span>
                </Link>

                {thread.canManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={tc("threadActions")}
                        className="absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => openRename(thread)}>
                        <Pencil />
                        {tc("rename")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setDeleteTarget(thread)}
                      >
                        <Trash2 />
                        {tc("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}

          {!loadingThreads && threads.length === 0 && (
            <p className="px-3.5 py-6 text-center text-sm text-muted-foreground">
              {items.length === 0 ? tc("emptyThreads") : tc("noThreads", { filter })}
            </p>
          )}
        </div>
      </div>

      {/* Account controls — search + admin links, theme, language, sign out. */}
      <div className="flex flex-col gap-2.5 border-t border-border p-3">
        <Button
          asChild
          variant={onSearch ? "secondary" : "outline"}
          size="sm"
          className={cn("w-full justify-start gap-2", onSearch && "border-primary/40 text-primary")}
        >
          <Link href={PROTECTED_ROUTES.SEARCH} onClick={onNavigate}>
            <Library className="size-4" />
            {tc("search")}
          </Link>
        </Button>
        {isAdmin && (
          <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2">
            <Link href={PROTECTED_ROUTES.ADMIN} onClick={onNavigate}>
              <ShieldCheck className="size-4" />
              {tc("admin")}
            </Link>
          </Button>
        )}
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

      {/* Rename dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tc("renameTitle")}</DialogTitle>
            <DialogDescription>{tc("renameDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitRename} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold text-foreground">{tc("renameLabel")}</span>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder={tc("renamePlaceholder")}
                autoFocus
                maxLength={255}
              />
            </label>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setRenameTarget(null)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={!renameValue.trim() || renameMutation.isPending}>
                {tc("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{tc("deleteTitle")}</DialogTitle>
            <DialogDescription>
              {tc("deleteDescription", { title: deleteTarget?.title ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>
              {tc("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {tc("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};
