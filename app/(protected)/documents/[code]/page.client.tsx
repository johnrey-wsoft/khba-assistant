"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Notice, Seal } from "@/components/chat/primitives";
import { DocumentMarkdown, DocumentRaw } from "@/components/chat/document-markdown";
import {
  DocViewToggle,
  OriginalDocument,
  TextModeSelect,
  type DocView,
  type FullDocument,
  type TextMode,
} from "@/components/chat/document-view";
import { authorityLabel } from "@/lib/chat/authority";
import { API_ROUTES, PROTECTED_ROUTES } from "@/constants/routes.constant";

const BodySkeleton = () => (
  <div className="flex flex-col gap-3">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="flex flex-col gap-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-11/12" />
      </div>
    ))}
  </div>
);

// A short article label from the node path (e.g. "…/제12조" -> "제12조").
const articleLabel = (nodePath: string): string | null => {
  const tail = nodePath.split(/[/>]/).pop()?.trim();
  return tail && tail.length <= 40 ? tail : null;
};

export const PageClient = ({ code }: { code: string }) => {
  const t = useTranslations("chat");
  // Optional cited excerpt to scroll to / highlight (deep-link from the chat
  // evidence panel).
  const snippet = useSearchParams().get("snippet") ?? undefined;
  const [view, setView] = useState<DocView>("text");
  const [textMode, setTextMode] = useState<TextMode>("read");
  const citedRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["document", code],
    queryFn: async (): Promise<FullDocument> => {
      const res = await fetch(API_ROUTES.DOCUMENTS.BY_CODE(encodeURIComponent(code)));
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed to load document");
      return json.data as FullDocument;
    },
    staleTime: 5 * 60 * 1000,
  });

  const baseDate = data?.effectiveFrom;
  const hasOriginal = Boolean(data?.hasOriginal);
  const contentType = data?.contentType ?? "";
  const canPreview = contentType.includes("pdf") || contentType.startsWith("image/");
  const downloadUrl = API_ROUTES.DOCUMENTS.DOWNLOAD(encodeURIComponent(code));

  // Once the doc resolves: prefer the original file when there's nothing to
  // highlight; if we arrived with a cited excerpt, stay on the text so it shows.
  useEffect(() => {
    if (data && canPreview && !snippet) setView("document");
  }, [data, canPreview, snippet]);

  // Bring the cited passage into view (text view only).
  useEffect(() => {
    if (view === "text" && data && citedRef.current) {
      citedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [data, view]);

  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      {/* Top bar — back + document title. */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card/85 px-4 py-3 backdrop-blur sm:px-6">
        <Button asChild variant="outline" size="sm" className="flex-none gap-1.5">
          <Link href={PROTECTED_ROUTES.SEARCH}>
            <ArrowLeft className="size-4" />
            {t("back")}
          </Link>
        </Button>
        <span className="truncate text-sm font-extrabold text-foreground">
          {data?.title ?? t("viewerTitle")}
        </span>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {isError ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            {t("docNotFound")}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {/* Meta header — title + badges on the left, download on the right. */}
            <div className="flex flex-col gap-2.5 border-b border-border px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                  {data ? (
                    <span className="text-base font-bold text-foreground">{data.title}</span>
                  ) : (
                    <Skeleton className="h-5 w-64" />
                  )}
                  {data && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="rounded-[5px] border-primary/20 bg-primary/5 text-primary"
                      >
                        {authorityLabel(data.authorityType)}
                      </Badge>
                      {baseDate && (
                        <Seal>
                          {t("baseDate")} {baseDate}
                        </Seal>
                      )}
                      {data.jurisdictionCode && (
                        <span className="font-mono text-xs text-muted-foreground">
                          {data.jurisdictionCode}
                        </span>
                      )}
                      <span className="font-mono text-xs text-muted-foreground">
                        {data.documentCode}
                      </span>
                    </div>
                  )}
                </div>
                {hasOriginal && (
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex flex-none items-center gap-1 text-sm font-bold text-primary hover:underline"
                  >
                    <Download className="size-4" />
                    {t("download")}
                  </a>
                )}
              </div>

              {/* View options — Text/Document + Read/Raw, spread apart. */}
              {data && (canPreview || data.passages.length > 0) && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
                  {canPreview ? <DocViewToggle value={view} onChange={setView} /> : <span />}
                  {view === "text" && data.passages.length > 0 ? (
                    <TextModeSelect value={textMode} onChange={setTextMode} />
                  ) : (
                    <span />
                  )}
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6">
              {isLoading && <BodySkeleton />}

              {view === "document" && data && (
                <OriginalDocument
                  downloadUrl={downloadUrl}
                  contentType={contentType}
                  title={data.title}
                />
              )}

              {view === "text" && data && data.passages.length > 0 && (
                <div
                  className="rounded-xl border border-border bg-background px-5 py-4"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(var(--background) 0 31px, var(--border) 31px 32px)",
                  }}
                >
                  {data.passages.map((passage) => {
                    const isCited =
                      !!snippet && (passage.text === snippet || passage.text.includes(snippet));
                    const label = articleLabel(passage.nodePath);
                    const Renderer = textMode === "raw" ? DocumentRaw : DocumentMarkdown;
                    return (
                      <div
                        key={passage.nodePath}
                        ref={isCited ? citedRef : undefined}
                        className="scroll-mt-20"
                      >
                        {label && (
                          <div className="mb-1 text-sm font-bold text-foreground">{label}</div>
                        )}
                        <Renderer highlight={isCited ? snippet : undefined}>
                          {passage.text}
                        </Renderer>
                      </div>
                    );
                  })}
                </div>
              )}

              {view === "text" && data && data.passages.length === 0 && !isLoading && (
                <div className="rounded-xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                  {t("docEmpty")}
                </div>
              )}

              {data && (
                <Notice tone="seal" className="mt-5">
                  <span className="font-bold text-seal">{t("finalCheck")}</span> —{" "}
                  {t("panelNotice")}
                </Notice>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
