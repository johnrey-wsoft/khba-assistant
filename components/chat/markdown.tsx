"use client";

import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ChatSource } from "@/components/chat/primitives";
import { authorityLabel } from "@/lib/chat/authority";

// A citation binds a display number to its source document (which carries the
// type = authorityType and classification = securityClass).
export type Citation = {
  number: number;
  source: ChatSource;
};

const CITE_PREFIX = "cite:";

const CitationChip = ({
  citation,
  onCite,
}: {
  citation: Citation;
  onCite: (source: ChatSource) => void;
}) => (
  <Tooltip delayDuration={200}>
    <TooltipTrigger asChild>
      <button
        type="button"
        onClick={() => onCite(citation.source)}
        className="mx-0.5 inline-flex h-4 min-w-4 translate-y-[-1px] items-center justify-center rounded bg-accent px-1 align-middle text-[11px] font-bold text-accent-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        {citation.number}
      </button>
    </TooltipTrigger>
    <TooltipContent className="max-w-[260px]">
      <div className="flex flex-col gap-0.5 text-left">
        <span className="font-semibold">{citation.source.title}</span>
        <span className="font-mono opacity-80">
          {citation.source.documentCode} · {authorityLabel(citation.source.authorityType)} ·{" "}
          {citation.source.securityClass ?? "PUBLIC"}
        </span>
      </div>
    </TooltipContent>
  </Tooltip>
);

type MarkdownProps = {
  children: string;
  citations: Citation[];
  onCite: (source: ChatSource) => void;
};

export const Markdown = ({ children, citations, onCite }: MarkdownProps) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    // Keep href sanitization for normal links, but allow our cite: scheme.
    urlTransform={(url) => (url.startsWith(CITE_PREFIX) ? url : defaultUrlTransform(url))}
    components={{
      p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
      strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
      ul: ({ children }) => (
        <ul className="mb-3 flex list-disc flex-col gap-1 pl-5 last:mb-0">{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className="mb-3 flex list-decimal flex-col gap-1 pl-5 last:mb-0">{children}</ol>
      ),
      a: ({ href, children }) => {
        if (href?.startsWith(CITE_PREFIX)) {
          const number = Number.parseInt(href.slice(CITE_PREFIX.length), 10);
          const citation = citations.find((c) => c.number === number);
          if (citation) {
            return <CitationChip citation={citation} onCite={onCite} />;
          }
          return null;
        }
        return (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className={cn("text-primary underline underline-offset-2")}
          >
            {children}
          </a>
        );
      },
    }}
  >
    {children}
  </ReactMarkdown>
);
