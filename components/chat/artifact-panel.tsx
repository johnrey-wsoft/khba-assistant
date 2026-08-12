"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { X, ExternalLink, Download, FileText } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Notice, Seal } from "@/components/chat/primitives";
import type { ChatSource } from "@/components/chat/primitives";
import { authorityLabel } from "@/lib/chat/authority";

type DocumentPassage = { nodePath: string; text: string };
type FullDocument = {
  documentCode: string;
  title: string;
  authorityType: string;
  jurisdictionCode: string | null;
  securityClass: string;
  effectiveFrom: string | null;
  hasOriginal: boolean;
  contentType: string | null;
  originalFilename: string | null;
  passages: DocumentPassage[];
};

const BodySkeleton = () => (
  <div className="flex flex-col gap-3">
    {[0, 1, 2].map((i) => (
      <div key={i} className="flex flex-col gap-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-11/12" />
      </div>
    ))}
  </div>
);

// Wrap the exact snippet the answer cited in a gold <mark>, matching the
// prototype's "excerpt used in the answer" highlight.
const HighlightedText = ({ text, snippet }: { text: string; snippet?: string }) => {
  if (!snippet) return <>{text}</>;
  const idx = text.indexOf(snippet);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="evidence-flash rounded-[3px] bg-highlight px-1 py-0.5 font-medium text-highlight-foreground">
        {snippet}
      </mark>
      {text.slice(idx + snippet.length)}
    </>
  );
};

// A short article label from the node path (e.g. "…/제12조" -> "제12조").
const articleLabel = (nodePath: string): string | null => {
  const tail = nodePath.split(/[/>]/).pop()?.trim();
  return tail && tail.length <= 40 ? tail : null;
};

type ArtifactPanelProps = {
  sources: ChatSource[];
  initialIndex: number;
  onClose: () => void;
};

export const ArtifactPanel = ({ sources, initialIndex, onClose }: ArtifactPanelProps) => {
  const t = useTranslations("chat");
  const [active, setActive] = useState(initialIndex);
  const [view, setView] = useState<"text" | "document">("text");
  const source = sources[active] ?? sources[0];
  const citedRef = useRef<HTMLParagraphElement>(null);

  // Switching source tabs resets back to the searchable text view.
  const selectTab = (i: number) => {
    setActive(i);
    setView("text");
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["document", source.documentCode],
    queryFn: async (): Promise<FullDocument> => {
      const res = await fetch(`/api/documents/${encodeURIComponent(source.documentCode)}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed to load document");
      return json.data as FullDocument;
    },
    staleTime: 5 * 60 * 1000,
  });

  const baseDate = data?.effectiveFrom;
  const hasOriginal = Boolean(data?.hasOriginal);
  const contentType = data?.contentType ?? "";
  const isPdf = contentType.includes("pdf");
  const isImage = contentType.startsWith("image/");
  const canPreview = isPdf || isImage;
  const downloadUrl = `/api/documents/${encodeURIComponent(source.documentCode)}/download`;

  // Bring the cited passage into view once the (active) document resolves — but
  // only in the text view (the document view has no passages to scroll to).
  useEffect(() => {
    if (view === "text" && data && citedRef.current) {
      citedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [data, view]);

  return (
    <>
      {/* Mobile-only backdrop: tap to dismiss the overlay panel. */}
      <div
        onClick={onClose}
        aria-hidden
        className="fixed inset-0 z-40 bg-black/50 duration-200 animate-in fade-in md:hidden"
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-[540px] flex-none flex-col border-l border-border bg-card shadow-xl duration-200 animate-in slide-in-from-right-4 fade-in md:static md:z-auto md:shadow-none">
        {/* Pane head — title + the excerpt legend. */}
        <header className="flex items-center gap-3 border-b border-border bg-muted/40 px-5 py-3.5">
          <span className="text-sm font-extrabold text-foreground">{t("viewerTitle")}</span>
          {view === "text" && (
            <span className="ml-auto hidden items-center gap-1.5 text-xs font-medium text-muted-foreground sm:flex">
              <span className="h-3 w-5 rounded-[3px] border border-seal-border bg-highlight" />
              {t("excerptLegend")}
            </span>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            title="Close"
            aria-label="Close source panel"
            className="ml-1"
          >
            <X />
          </Button>
        </header>

        {/* Tabs — one per source cited in the answer. */}
        {sources.length > 1 && (
          <div className="flex gap-1 overflow-x-auto border-b border-border bg-muted/40 px-4 [scrollbar-width:none]">
            {sources.map((s, i) => (
              <button
                key={s.documentCode}
                type="button"
                onClick={() => selectTab(i)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-3 py-3 text-[12.5px] font-semibold whitespace-nowrap transition-colors",
                  i === active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="grid size-[15px] flex-none place-items-center rounded-[4px] bg-foreground font-mono text-[10px] font-bold text-background">
                  {i + 1}
                </span>
                <span className="max-w-[140px] truncate">{s.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Doc meta — title, type, base-date seal, jurisdiction. */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          <span className="text-sm font-bold text-foreground">{source.title}</span>
          <Badge
            variant="outline"
            className="rounded-[5px] border-primary/20 bg-primary/5 text-primary"
          >
            {authorityLabel(source.authorityType)}
          </Badge>
          {baseDate && (
            <Seal>
              {t("baseDate")} {baseDate}
            </Seal>
          )}
          {source.jurisdictionCode && (
            <span className="font-mono text-xs text-muted-foreground">
              {source.jurisdictionCode}
            </span>
          )}

          {hasOriginal && (
            <>
              <span className="flex-1" />
              {canPreview && (
                <div className="inline-flex rounded-full border border-border bg-card p-0.5">
                  {(["text", "document"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setView(mode)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold transition-colors",
                        view === mode
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {mode === "text" ? t("viewText") : t("viewDocument")}
                    </button>
                  ))}
                </div>
              )}
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                {t("openOriginal")}
                <ExternalLink className="size-3.5" />
              </a>
            </>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-5 p-6">
            {isLoading && <BodySkeleton />}

            {/* Original document — embedded (PDF/image) or a download prompt. */}
            {view === "document" &&
              (canPreview ? (
                isPdf ? (
                  <iframe
                    src={`${downloadUrl}?inline=1`}
                    title={source.title}
                    className="h-[70vh] w-full rounded-xl border border-border bg-background"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${downloadUrl}?inline=1`}
                    alt={source.title}
                    className="w-full rounded-xl border border-border"
                  />
                )
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/40 p-8 text-center">
                  <FileText className="size-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t("cantPreview")}</p>
                  <Button asChild size="sm">
                    <a href={downloadUrl} target="_blank" rel="noreferrer">
                      <Download className="size-4" />
                      {t("download")}
                    </a>
                  </Button>
                </div>
              ))}

            {/* Paper "document page" — faint ruling behind the article text. */}
            {view === "text" && (isError || (data && data.passages.length > 0)) && (
              <div
                className="rounded-xl border border-border bg-background px-5 py-4"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(var(--background) 0 31px, var(--border) 31px 32px)",
                }}
              >
                {isError && source.snippet && (
                  // Fallback to the cited passage if the full document can't load.
                  <p className="text-[15px] leading-8 whitespace-pre-wrap text-foreground/90">
                    <mark className="evidence-flash rounded-[3px] bg-highlight px-1 py-0.5 font-medium text-highlight-foreground">
                      {source.snippet}
                    </mark>
                  </p>
                )}

                {data?.passages.map((passage) => {
                  const isCited =
                    !!source.snippet &&
                    (passage.text === source.snippet || passage.text.includes(source.snippet));
                  const label = articleLabel(passage.nodePath);
                  return (
                    <p
                      key={passage.nodePath}
                      ref={isCited ? citedRef : undefined}
                      className="scroll-mt-6 text-[15px] leading-8 whitespace-pre-wrap text-foreground/90"
                    >
                      {label && <span className="mr-1.5 font-bold text-foreground">{label}</span>}
                      {isCited ? (
                        <HighlightedText text={passage.text} snippet={source.snippet} />
                      ) : (
                        passage.text
                      )}
                    </p>
                  );
                })}
              </div>
            )}

            <Notice tone="seal">
              <span className="font-bold text-seal">{t("finalCheck")}</span> — {t("panelNotice")}
            </Notice>
          </div>
        </div>
      </aside>
    </>
  );
};
