"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Search, ChevronDown, Check, ShieldCheck, Shield, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getAdminUsersQueryOptions } from "@/queries/admin.query";
import { adminService } from "@/services/admin.service";
import type { AdminMember, AdminMemberPatch } from "@/lib/admin/types";
import { getQueryKey } from "@/lib/query/get-query-keys";
import { formatWhen } from "@/lib/chat/session";
import {
  VERIFICATION_STATUSES,
  type VerificationStatus,
} from "@/constants/verification-status.constant";

const STATUS_DOT: Record<VerificationStatus, string> = {
  approved: "bg-chart-2",
  pending: "bg-chart-3",
  rejected: "bg-destructive",
};

const ACCESS_BADGE: Record<"admin" | "member", string> = {
  admin: "bg-primary/10 text-primary",
  member: "bg-muted text-muted-foreground",
};

type PageClientProps = { currentUserId: string };

export const PageClient = ({ currentUserId }: PageClientProps) => {
  const queryClient = useQueryClient();
  const t = useTranslations("admin");
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
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
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
                <th className="px-4 py-3">{t("colAccess")}</th>
                <th className="px-4 py-3">{t("colApproval")}</th>
                <th className="px-4 py-3">{t("colJoined")}</th>
                <th className="px-4 py-3 text-right">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td className="px-4 py-3">
                      <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                      <div className="mt-1.5 h-3 w-44 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-8 w-28 animate-pulse rounded-md bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="ml-auto size-8 animate-pulse rounded-md bg-muted" />
                    </td>
                  </tr>
                ))}
              {!isLoading &&
                filtered.map((m) => {
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
                      <td className="px-4 py-3 text-foreground">{m.company || "—"}</td>

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
      </div>
    </div>
  );
};
