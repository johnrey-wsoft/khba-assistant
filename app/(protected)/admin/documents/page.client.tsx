"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  UploadCloud,
  RefreshCw,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentMarkdown } from "@/components/chat/document-markdown";
import { cn } from "@/lib/utils";
import { getAdminDocumentsQueryOptions } from "@/queries/admin-documents.query";
import { adminDocumentsService } from "@/services/admin-documents.service";
import type { AdminDocument, AdminDocumentPatch, DocumentStatus } from "@/lib/admin/types";
import { getQueryKey } from "@/lib/query/get-query-keys";
import { authorityLabel } from "@/lib/chat/authority";

const AUTHORITY_TYPES = [
  "LAW",
  "ORDINANCE",
  "ADMIN_RULE",
  "INTERPRETATION",
  "ASSOCIATION_GUIDE",
  "MEMBER_CASE",
];
const SECURITY_CLASSES = ["PUBLIC", "INTERNAL", "CONFIDENTIAL"];

const PAGE_SIZE = 8;

const STATUS_DOT: Record<DocumentStatus, string> = {
  completed: "bg-chart-2",
  waiting: "bg-chart-3",
  failed: "bg-destructive",
};
const STATUS_TEXT: Record<DocumentStatus, string> = {
  completed: "text-chart-2",
  waiting: "text-chart-3",
  failed: "text-destructive",
};

type FormState = {
  title: string;
  authorityType: string;
  securityClass: string;
  effectiveFrom: string;
  active: boolean;
};

// "yyyy-MM-dd" <-> local Date, avoiding the UTC shift new Date("yyyy-MM-dd") causes.
const parseDate = (s: string): Date | undefined => {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
};
const fmtDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const toForm = (d: AdminDocument): FormState => ({
  title: d.title,
  authorityType: d.authorityType,
  securityClass: d.securityClass,
  effectiveFrom: d.effectiveFrom ?? "",
  active: d.active,
});

// Metadata editor — mounted with a `key` of the document code, so its form
// state initializes fresh from props (no sync effect needed).
const MetadataPanel = ({
  doc,
  onSave,
  onReindex,
  onDelete,
  saving,
  reindexing,
  deleting,
}: {
  doc: AdminDocument;
  onSave: (patch: AdminDocumentPatch) => void;
  onReindex: () => void;
  onDelete: () => void;
  saving: boolean;
  reindexing: boolean;
  deleting: boolean;
}) => {
  const t = useTranslations("adminDocs");
  const [form, setForm] = useState<FormState>(() => toForm(doc));

  // Parsed content of this document (what the RAG ingested), for a preview.
  const { data: content, isLoading: contentLoading } = useQuery({
    queryKey: ["admin-document-content", doc.documentCode],
    queryFn: async (): Promise<{ passages: { nodePath: string; text: string }[] }> => {
      const res = await fetch(`/api/documents/${encodeURIComponent(doc.documentCode)}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed to load document");
      return json.data;
    },
    staleTime: 60_000,
  });

  return (
    <>
      <div className="flex flex-col gap-4 p-5">
        {/* Parsed-content preview */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-foreground">{t("preview")}</span>
          <div className="max-h-64 overflow-y-auto rounded-xl border border-border bg-muted/30 p-4">
            {contentLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-5/6" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
            ) : content && content.passages.length > 0 ? (
              <DocumentMarkdown>
                {content.passages.map((p) => p.text).join("\n\n")}
              </DocumentMarkdown>
            ) : (
              <p className="text-sm text-muted-foreground">{t("previewEmpty")}</p>
            )}
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-foreground">{t("fieldName")}</span>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            aria-invalid={!form.title.trim()}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-foreground">{t("fieldType")}</span>
            <Select
              value={form.authorityType}
              onValueChange={(v) => setForm({ ...form, authorityType: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTHORITY_TYPES.map((a) => (
                  <SelectItem key={a} value={a}>
                    {authorityLabel(a)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-foreground">{t("fieldVisibility")}</span>
            <Select
              value={form.securityClass}
              onValueChange={(v) => setForm({ ...form, securityClass: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECURITY_CLASSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`security.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-foreground">{t("fieldBaseDate")}</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2 font-normal">
                <CalendarDays className="size-4 text-muted-foreground" />
                {form.effectiveFrom ? (
                  <span className="font-mono">{form.effectiveFrom}</span>
                ) : (
                  <span className="text-muted-foreground">{t("pickDate")}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                captionLayout="dropdown"
                selected={parseDate(form.effectiveFrom)}
                onSelect={(d) => setForm({ ...form, effectiveFrom: d ? fmtDate(d) : "" })}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-3">
          <span className="text-sm font-semibold text-foreground">
            {t("activeLabel")}
            <span className="block text-xs font-normal text-muted-foreground">
              {t("activeHint")}
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={form.active}
            onClick={() => setForm({ ...form, active: !form.active })}
            className={cn(
              "relative h-6 w-11 flex-none rounded-full transition-colors",
              form.active ? "bg-primary" : "bg-input"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
                form.active && "translate-x-5"
              )}
            />
          </button>
        </div>

        <Button
          variant="outline"
          className="w-full gap-2"
          disabled={reindexing}
          onClick={onReindex}
        >
          <RefreshCw className={cn("size-4", reindexing && "animate-spin")} />
          {reindexing ? t("reindexing") : t("reindex")}
        </Button>
      </div>

      <div className="flex items-center gap-2 border-t border-border bg-muted/40 px-4 py-3">
        <Button
          disabled={!form.title.trim() || saving}
          onClick={() =>
            onSave({
              title: form.title.trim(),
              authorityType: form.authorityType,
              securityClass: form.securityClass,
              effectiveFrom: form.effectiveFrom || null,
              active: form.active,
            })
          }
        >
          {saving ? t("saving") : t("save")}
        </Button>
        <Button variant="secondary" onClick={() => setForm(toForm(doc))}>
          {t("revert")}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto text-destructive"
              title={t("delete")}
            >
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("deleteConfirm", { title: doc.title })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={onDelete} disabled={deleting}>
                {deleting ? t("deleting") : t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export const PageClient = () => {
  const queryClient = useQueryClient();
  const t = useTranslations("adminDocs");
  const [filter, setFilter] = useState<"all" | DocumentStatus>("all");
  const [page, setPage] = useState(1);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  // Server-side pagination: state -> params -> query. keepPreviousData keeps the
  // current page visible while the next one loads.
  const params = useMemo(() => ({ status: filter, page, pageSize: PAGE_SIZE }), [filter, page]);
  const { data, isLoading, isFetching } = useQuery(getAdminDocumentsQueryOptions(params));
  const documents = data?.items ?? [];
  const selected = documents.find((d) => d.documentCode === selectedCode) ?? null;

  // Invalidates every page/filter variation (the base key is a prefix).
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getQueryKey.admin.documents() });

  const saveMutation = useMutation({
    mutationFn: ({ code, patch }: { code: string; patch: AdminDocumentPatch }) =>
      adminDocumentsService.update(code, patch),
    onSuccess: () => {
      invalidate();
      toast.success(t("saved"));
    },
    onError: () => toast.error(t("actionError")),
  });

  const reindexMutation = useMutation({
    mutationFn: (code: string) => adminDocumentsService.reindex(code),
    onSuccess: () => toast.success(t("reindexStarted")),
    onError: () => toast.error(t("actionError")),
  });

  const deleteMutation = useMutation({
    mutationFn: (code: string) => adminDocumentsService.remove(code),
    onSuccess: () => {
      setSelectedCode(null);
      invalidate();
      toast.success(t("deleted"));
    },
    onError: () => toast.error(t("actionError")),
  });

  // --- Upload ------------------------------------------------------------
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  // In-flight uploads shown as optimistic "processing" rows in the pipeline.
  const [uploading, setUploading] = useState<{ id: string; name: string }[]>([]);
  const isUploading = uploading.length > 0;

  const onFiles = (files: FileList | null) => {
    const list = files ? Array.from(files) : [];
    if (list.length === 0) return;

    const items = list.map((file) => ({ id: crypto.randomUUID(), name: file.name, file }));
    setUploading((prev) => [...prev, ...items.map(({ id, name }) => ({ id, name }))]);
    setPage(1); // surface the in-flight rows on the first page

    // Upload one at a time; each doc drops its "processing" row and refreshes
    // the list (so it reappears as a real, completed row) as it finishes.
    void (async () => {
      for (const { id, name, file } of items) {
        try {
          await adminDocumentsService.upload(file);
          invalidate();
          toast.success(t("uploaded", { count: 1 }));
        } catch {
          toast.error(t("uploadError", { name }));
        } finally {
          setUploading((prev) => prev.filter((u) => u.id !== id));
        }
      }
    })();
  };

  const statusLabel = (s: DocumentStatus) => t(`status.${s}`);

  // Stats and pagination come from the server; the current page is already
  // filtered + sliced, so the list renders `documents` directly.
  const stats = data?.stats ?? { total: 0, completed: 0, waiting: 0, failed: 0, evidence: 0 };
  const pageCount = data?.pageCount ?? 1;
  const safePage = Math.min(page, pageCount);

  const statTiles: { key: string; value: number; accent?: string }[] = [
    { key: "total", value: stats.total },
    { key: "indexed", value: stats.completed, accent: "text-chart-2" },
    { key: "pending", value: stats.waiting + uploading.length, accent: "text-chart-3" },
    { key: "failed", value: stats.failed, accent: "text-destructive" },
    { key: "evidence", value: stats.evidence },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statTiles.map((s) => (
          <div key={s.key} className="rounded-2xl border border-border bg-card px-4 py-3.5">
            <div className={cn("font-mono text-2xl font-extrabold tracking-tight", s.accent)}>
              {isLoading ? (
                <span className="inline-block h-6 w-8 animate-pulse rounded bg-muted align-middle" />
              ) : (
                s.value
              )}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">{t(`stats.${s.key}`)}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
        {/* Left: dropzone + pipeline */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* Dropzone — upload + ingest */}
          <div
            role="button"
            tabIndex={0}
            aria-disabled={isUploading}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !isUploading) {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (!isUploading) onFiles(e.dataTransfer.files);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed px-5 py-6 text-center transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-border bg-muted/40",
              isUploading && "pointer-events-none opacity-70"
            )}
          >
            {isUploading ? (
              <RefreshCw className="size-6 animate-spin text-primary" />
            ) : (
              <UploadCloud className="size-6 text-muted-foreground" />
            )}
            <div className="text-sm font-bold text-foreground">
              {isUploading ? t("uploading") : t("dropzoneTitle")}
            </div>
            <div className="text-xs text-muted-foreground">{t("dropzoneSub")}</div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                onFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {/* Pipeline */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
              <h2 className="text-sm font-extrabold tracking-tight text-foreground">
                {t("pipelineTitle")}
              </h2>
              <div className="ml-auto flex gap-1">
                {(["all", "completed", "waiting", "failed"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setFilter(f);
                      setPage(1);
                    }}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11.5px] font-bold transition-colors",
                      filter === f
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t(`filter.${f}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-border">
              {/* Optimistic rows for files currently being ingested. Shown while
                  the synchronous upload runs, then replaced by the real row on
                  invalidate. Only under the "all"/"waiting" filters. */}
              {(filter === "all" || filter === "waiting") &&
                uploading.map((u) => (
                  <div
                    key={u.id}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                    aria-busy
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-bold text-foreground">{u.name}</span>
                      </div>
                      <div className="mt-1.5 h-1 w-full max-w-40 overflow-hidden rounded-full bg-muted">
                        <div className="h-full w-2/5 animate-pulse rounded-full bg-chart-3" />
                      </div>
                    </div>
                    <span className="inline-flex flex-none items-center gap-1.5 text-xs font-bold text-chart-3">
                      <span className="size-2 animate-pulse rounded-full bg-chart-3" />
                      {t("status.processing")}
                    </span>
                  </div>
                ))}

              {!isFetching &&
                documents.map((d) => (
                  <button
                    key={d.documentCode}
                    type="button"
                    onClick={() => setSelectedCode(d.documentCode)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                      selectedCode === d.documentCode
                        ? "bg-accent shadow-[inset_3px_0_0] shadow-primary"
                        : "hover:bg-muted/60"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-bold text-foreground">
                          {d.title}
                        </span>
                        <span className="rounded-[5px] border border-primary/20 bg-primary/5 px-1.5 py-0 text-[11px] font-bold text-primary">
                          {authorityLabel(d.authorityType)}
                        </span>
                        {!d.active && (
                          <span className="rounded-[5px] bg-muted px-1.5 py-0 text-[11px] font-bold text-muted-foreground">
                            {t("inactive")}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
                        {d.jurisdictionCode && (
                          <span className="font-mono">{d.jurisdictionCode}</span>
                        )}
                        {d.effectiveFrom && (
                          <span>
                            {t("baseDate")} {d.effectiveFrom}
                          </span>
                        )}
                        <span className="font-mono">{d.documentCode}</span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex flex-none items-center gap-1.5 text-xs font-bold",
                        STATUS_TEXT[d.status]
                      )}
                    >
                      <span className={cn("size-2 rounded-full", STATUS_DOT[d.status])} />
                      {statusLabel(d.status)}
                    </span>
                  </button>
                ))}

              {!isFetching && documents.length === 0 && uploading.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
              )}
              {isFetching && (
                <div className="flex flex-col gap-0.5 p-2.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {pageCount > 1 && (
              <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5">
                <span className="text-[11.5px] text-muted-foreground">
                  {t("pageOf", { page: safePage, total: pageCount })}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-3.5" />
                    {t("prev")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    disabled={safePage >= pageCount}
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  >
                    {t("next")}
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: metadata */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card lg:sticky lg:top-4">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <h2 className="text-sm font-extrabold tracking-tight text-foreground">
              {t("metaTitle")}
            </h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              {selected?.documentCode ?? "—"}
            </span>
          </div>

          {selected ? (
            <MetadataPanel
              key={selected.documentCode}
              doc={selected}
              saving={saveMutation.isPending}
              reindexing={reindexMutation.isPending}
              deleting={deleteMutation.isPending}
              onSave={(patch) => saveMutation.mutate({ code: selected.documentCode, patch })}
              onReindex={() => reindexMutation.mutate(selected.documentCode)}
              onDelete={() => deleteMutation.mutate(selected.documentCode)}
            />
          ) : (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">{t("metaEmpty")}</p>
          )}
        </div>
      </div>
    </div>
  );
};
