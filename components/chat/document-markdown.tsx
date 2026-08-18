"use client";

import { type ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

const HIGHLIGHT_CLASS =
  "evidence-flash rounded-[3px] bg-highlight px-1 py-0.5 font-medium text-highlight-foreground";

// Minimal hast node shape for the highlight transform below.
interface HNode {
  type: string;
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HNode[];
}

// A rehype plugin that wraps every occurrence of `snippet` in a bare <mark>
// (styled by the `mark` component override), so the exact cited excerpt keeps
// its gold highlight even after the passage is rendered as markdown.
const rehypeHighlight = (snippet?: string) => () => (tree: HNode) => {
  if (!snippet) return;

  const walk = (node: HNode) => {
    if (!node.children) return;
    const next: HNode[] = [];
    for (const child of node.children) {
      if (child.type === "text" && child.value?.includes(snippet)) {
        const parts = child.value.split(snippet);
        parts.forEach((part, i) => {
          if (part) next.push({ type: "text", value: part });
          if (i < parts.length - 1) {
            next.push({
              type: "element",
              tagName: "mark",
              properties: {},
              children: [{ type: "text", value: snippet }],
            });
          }
        });
      } else {
        walk(child);
        next.push(child);
      }
    }
    node.children = next;
  };

  walk(tree);
};

type RehypePlugins = ComponentProps<typeof ReactMarkdown>["rehypePlugins"];

const MARKDOWN_COMPONENTS: ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: ({ children }) => (
    <h1 className="mt-4 mb-2 text-lg font-extrabold text-foreground first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-4 mb-2 text-base font-bold text-foreground first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 mb-1.5 text-sm font-bold text-foreground first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-3 mb-1.5 text-sm font-bold text-foreground first:mt-0">{children}</h4>
  ),
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-3 flex list-disc flex-col gap-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 flex list-decimal flex-col gap-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-primary underline underline-offset-2"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-border pl-3 text-muted-foreground last:mb-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-border" />,
  code: ({ children }) => (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-[13px] last:mb-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-[13.5px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-border px-2.5 py-1.5 text-left font-bold text-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-2.5 py-1.5 align-top">{children}</td>
  ),
  mark: ({ children }) => <mark className={HIGHLIGHT_CLASS}>{children}</mark>,
};

type DocumentMarkdownProps = {
  children: string;
  // When set, occurrences of this text are wrapped in the gold highlight.
  highlight?: string;
  className?: string;
};

// Prose renderer for ingested document passages (headings, lists, GFM tables,
// bold, code) with optional cited-excerpt highlighting.
export const DocumentMarkdown = ({ children, highlight, className }: DocumentMarkdownProps) => (
  <div className={cn("text-[15px] leading-8 text-foreground/90", className)}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight(highlight)] as RehypePlugins}
      components={MARKDOWN_COMPONENTS}
    >
      {children}
    </ReactMarkdown>
  </div>
);

// Inline-only markdown for short previews (e.g. source-card snippets): renders
// bold/italic/code/strikethrough inline and flattens block structure, so it
// stays valid inside a <button> and respects line-clamp.
const INLINE_ALLOWED = ["p", "strong", "em", "code", "del", "a", "br"];

const INLINE_COMPONENTS: ComponentProps<typeof ReactMarkdown>["components"] = {
  p: ({ children }) => <>{children}</>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children }) => (
    <code className="rounded bg-muted px-1 font-mono text-[0.9em]">{children}</code>
  ),
  del: ({ children }) => <del className="opacity-70">{children}</del>,
  // Non-interactive inside a clickable card — style only, no anchor.
  a: ({ children }) => (
    <span className="text-primary underline underline-offset-2">{children}</span>
  ),
};

export const InlineMarkdown = ({ children }: { children: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    allowedElements={INLINE_ALLOWED}
    unwrapDisallowed
    components={INLINE_COMPONENTS}
  >
    {children}
  </ReactMarkdown>
);
