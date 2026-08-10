"use client";

import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Notice } from "@/components/chat/primitives";
import type { ChatSource } from "@/components/chat/primitives";
import { authorityGlyph, authorityLabel } from "@/lib/chat/authority";

type DocumentPassage = { nodePath: string; text: string };
type FullDocument = {
  documentCode: string;
  title: string;
  authorityType: string;
  jurisdictionCode: string | null;
  securityClass: string;
  effectiveFrom: string | null;
  passages: DocumentPassage[];
};

const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-3 py-2">
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    <span className="text-right text-sm font-semibold text-foreground">{value}</span>
  </div>
);

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

type ArtifactPanelProps = {
  source: ChatSource;
  onClose: () => void;
};

export const ArtifactPanel = ({ source, onClose }: ArtifactPanelProps) => {
  const glyph = authorityGlyph(source.authorityType);

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

  return (
    <>
      {/* Mobile-only backdrop: tap to dismiss the overlay panel. */}
      <div
        onClick={onClose}
        aria-hidden
        className="fixed inset-0 z-40 bg-black/50 duration-200 animate-in fade-in md:hidden"
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-[520px] flex-none flex-col border-l border-border bg-card shadow-xl duration-200 animate-in slide-in-from-right-4 fade-in md:static md:z-auto md:shadow-none">
        <header className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <span className="grid size-9 flex-none place-items-center rounded-lg bg-accent text-lg font-bold text-accent-foreground">
            {glyph}
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-extrabold text-foreground">Source document</span>
            <span className="truncate font-mono text-xs text-muted-foreground">
              {source.documentCode}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            title="Close"
            aria-label="Close source panel"
          >
            <X />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-5 p-6">
            <h2 className="text-lg font-extrabold tracking-tight text-foreground">
              {source.title}
            </h2>

            <div className="rounded-xl border border-border bg-muted/40 px-4 py-1">
              <MetaRow label="Type" value={authorityLabel(source.authorityType)} />
              <MetaRow label="Document code" value={source.documentCode} />
              {source.jurisdictionCode && (
                <MetaRow label="Jurisdiction" value={source.jurisdictionCode} />
              )}
              <MetaRow label="Classification" value={source.securityClass ?? "PUBLIC"} />
              {data?.effectiveFrom && <MetaRow label="Base date" value={data.effectiveFrom} />}
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-sm font-extrabold text-foreground">Document</span>

              {isLoading && <BodySkeleton />}

              {isError && source.snippet && (
                // Fallback to the cited passage if the full document can't load.
                <blockquote className="rounded-xl border border-border border-l-4 border-l-primary bg-background px-4 py-3.5 text-base leading-relaxed font-medium text-foreground">
                  {source.snippet}
                </blockquote>
              )}

              {data?.passages.map((passage) => {
                // Highlight the passage that was cited in the answer.
                const isCited =
                  !!source.snippet &&
                  (passage.text === source.snippet || passage.text.includes(source.snippet));
                return (
                  <p
                    key={passage.nodePath}
                    className={cn(
                      "rounded-xl border px-4 py-3.5 text-base leading-relaxed font-medium whitespace-pre-wrap text-foreground",
                      isCited
                        ? "border-border border-l-4 border-l-primary bg-accent/40"
                        : "border-border bg-background"
                    )}
                  >
                    {passage.text}
                  </p>
                );
              })}
            </div>

            <Notice>
              This is a reference excerpt from the KHBA index. Confirm the current wording against
              the official published text before relying on it.
            </Notice>
          </div>
        </div>
      </aside>
    </>
  );
};
