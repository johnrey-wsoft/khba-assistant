"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  LogOut,
  ChevronDown,
  Check,
  ShieldCheck,
  Shield,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { LocaleSwitcher } from "@/components/marketing/locale-switcher";
import { cn } from "@/lib/utils";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getAdminUsersQueryOptions } from "@/queries/admin.query";
import { adminService } from "@/services/admin.service";
import type { AdminMember, AdminMemberPatch } from "@/lib/admin/types";
import { getQueryKey } from "@/lib/query/get-query-keys";
import { formatWhen } from "@/lib/chat/session";
import {
  VERIFICATION_STATUSES,
  type VerificationStatus,
} from "@/constants/verification-status.constant";
import { PUBLIC_ROUTES, PROTECTED_ROUTES } from "@/constants/routes.constant";

const STATUS_DOT: Record<VerificationStatus, string> = {
  approved: "bg-chart-2",
  pending: "bg-chart-3",
  rejected: "bg-destructive",
};

const ACCESS_BADGE: Record<"admin" | "member", string> = {
  admin: "bg-primary/10 text-primary",
  member: "bg-muted text-muted-foreground",
};

const formatBizNo = (value: string | null): string => {
  if (!value) return "—";
  const d = value.replace(/\D/g, "");
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}` : value;
};

type PageClientProps = { currentUserId: string };

export const PageClient = ({ currentUserId }: PageClientProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tr = useTranslations("onboarding");
  const [signingOut, startSignOut] = useTransition();
  const [query, setQuery] = useState("");

  const { data: members = [], isLoading } = useQuery(getAdminUsersQueryOptions());

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: AdminMemberPatch }) =>
      adminService.updateUser(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getQueryKey.admin.all });
      toast.success(t("updated"));
    },
    onError: () => toast.error(t("updateError")),
  });

  const mutatingId = updateMutation.isPending ? updateMutation.variables?.id : null;

  const signOut = () =>
    startSignOut(async () => {
      await getSupabaseClient().auth.signOut();
      router.replace(PUBLIC_ROUTES.ROOT);
      router.refresh();
    });

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return members;
    return members.filter((m) =>
      [m.name, m.email, m.company].filter(Boolean).some((v) => v!.toLowerCase().includes(q))
    );
  }, [members, q]);

  const pendingCount = members.filter((m) => m.verificationStatus === "pending").length;

  const statusLabel = (s: VerificationStatus) => t(`status.${s}`);

  const setStatus = (m: AdminMember, verificationStatus: VerificationStatus) => {
    if (m.verificationStatus === verificationStatus) return;
    updateMutation.mutate({ id: m.id, patch: { verificationStatus } });
  };

  const toggleRole = (m: AdminMember) => {
    updateMutation.mutate({
      id: m.id,
      patch: { accessRole: m.accessRole === "admin" ? "member" : "admin" },
    });
  };

  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="flex items-center gap-2.5 border-b border-border bg-card/85 px-6 py-3.5 backdrop-blur">
        <Button
          asChild
          variant="outline"
          size="icon"
          title={t("backToChat")}
          aria-label={t("backToChat")}
        >
          <Link href={PROTECTED_ROUTES.CHAT}>
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-base font-extrabold tracking-tight text-foreground">
            {t("title")}
          </span>
          <span className="truncate text-xs text-muted-foreground">{t("subtitle")}</span>
        </div>
        <span className="flex-1" />
        <LocaleSwitcher />
        <ModeToggle />
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
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {/* Toolbar */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex min-w-[240px] flex-1 items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono tabular-nums text-foreground">{members.length}</span>
            {t("members")}
            {pendingCount > 0 && (
              <span className="rounded-full bg-chart-3/10 px-2.5 py-1 text-xs font-bold text-chart-3">
                {t("pendingCount", { count: pendingCount })}
              </span>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-bold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{t("colMember")}</th>
                  <th className="px-4 py-3">{t("colCompany")}</th>
                  <th className="px-4 py-3">{t("colRole")}</th>
                  <th className="px-4 py-3">{t("colAccess")}</th>
                  <th className="px-4 py-3">{t("colApproval")}</th>
                  <th className="px-4 py-3">{t("colJoined")}</th>
                  <th className="px-4 py-3 text-right">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((m) => {
                  const isSelf = m.id === currentUserId;
                  const rowBusy = mutatingId === m.id;
                  return (
                    <tr key={m.id} className={cn("align-top", rowBusy && "opacity-60")}>
                      {/* Member */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                          <span className="truncate">{m.name}</span>
                          {isSelf && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                              {t("you")}
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{m.email}</div>
                      </td>

                      {/* Company */}
                      <td className="px-4 py-3">
                        <div className="truncate text-foreground">{m.company || "—"}</div>
                        <div className="font-mono text-xs tabular-nums text-muted-foreground">
                          {formatBizNo(m.businessRegistrationNumber)}
                        </div>
                      </td>

                      {/* Professional role */}
                      <td className="px-4 py-3 text-muted-foreground">
                        {m.role ? tr(`roles.${m.role}`) : "—"}
                      </td>

                      {/* Access role (read-only badge; change it in Actions) */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                            ACCESS_BADGE[m.accessRole]
                          )}
                        >
                          {m.accessRole === "admin" ? (
                            <ShieldCheck className="size-3.5" />
                          ) : (
                            <Shield className="size-3.5" />
                          )}
                          {t(`access.${m.accessRole}`)}
                        </span>
                      </td>

                      {/* Approval — dropdown to change verification status */}
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              disabled={rowBusy}
                            >
                              <span
                                className={cn(
                                  "size-2 flex-none rounded-full",
                                  STATUS_DOT[m.verificationStatus]
                                )}
                              />
                              {statusLabel(m.verificationStatus)}
                              <ChevronDown className="size-3.5 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {VERIFICATION_STATUSES.map((s) => (
                              <DropdownMenuItem key={s} onSelect={() => setStatus(m, s)}>
                                <Check
                                  className={cn(
                                    "size-4",
                                    m.verificationStatus === s ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {statusLabel(s)}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                        {formatWhen(m.createdAt).split(" ")[0]}
                      </td>

                      {/* Actions — role changes (and future per-member actions) */}
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              disabled={rowBusy}
                              aria-label={t("colActions")}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled={isSelf} onSelect={() => toggleRole(m)}>
                              {m.accessRole === "admin" ? (
                                <Shield className="size-4" />
                              ) : (
                                <ShieldCheck className="size-4" />
                              )}
                              {m.accessRole === "admin" ? t("makeMember") : t("makeAdmin")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!isLoading && filtered.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              {members.length === 0 ? t("empty") : t("noMatch", { query })}
            </p>
          )}
          {isLoading && (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t("loading")}</p>
          )}
        </div>
      </main>
    </div>
  );
};
