"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Notice, Seal } from "@/components/chat/primitives";
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
      <mark className="rounded-[3px] bg-highlight px-1 py-0.5 font-medium text-highlight-foreground">
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
  source: ChatSource;
  onClose: () => void;
};

export const ArtifactPanel = ({ source, onClose }: ArtifactPanelProps) => {
  const glyph = authorityGlyph(source.authorityType);
  const citedRef = useRef<HTMLParagraphElement>(null);

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

  // Bring the cited passage into view once the document resolves.
  const baseDate = data?.effectiveFrom;
  useEffect(() => {
    if (data && citedRef.current) {
      citedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [data]);

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
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-extrabold tracking-tight text-foreground">
                {source.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                  {authorityLabel(source.authorityType)}
                </Badge>
                {source.jurisdictionCode && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {source.jurisdictionCode}
                  </span>
                )}
                <span className="flex-1" />
                {baseDate && <Seal>Base date {baseDate}</Seal>}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-foreground">Original text</span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <span className="h-3 w-5 rounded-[3px] border border-seal-border bg-highlight" />
                  Excerpt used in the answer
                </span>
              </div>

              {isLoading && <BodySkeleton />}

              {/* Paper "document page" — faint ruling behind the article text. */}
              {(isError || (data && data.passages.length > 0)) && (
                <div
                  className="max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-background px-5 py-4"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(var(--background) 0 31px, var(--border) 31px 32px)",
                    backgroundAttachment: "local",
                  }}
                >
                  {isError && source.snippet && (
                    // Fallback to the cited passage if the full document can't load.
                    <p className="text-[15px] leading-8 whitespace-pre-wrap text-foreground/90">
                      <mark className="rounded-[3px] bg-highlight px-1 py-0.5 font-medium text-highlight-foreground">
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
                        {label && (
                          <span className="mr-1.5 font-bold text-foreground">{label}</span>
                        )}
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
            </div>

            <Notice tone="seal">
              <span className="font-bold text-seal">Final check</span> — a reference excerpt from
              the KHBA index, current as of the base date shown. Confirm the wording against the
              official published text before relying on it.
            </Notice>
          </div>
        </div>
      </aside>
    </>
  );
};
