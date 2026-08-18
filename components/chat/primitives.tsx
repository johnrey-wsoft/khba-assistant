import * as React from "react";
import { ArrowUpRight, Info, Stamp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { InlineMarkdown } from "@/components/chat/document-markdown";
import { authorityLabel } from "@/lib/chat/authority";

// --- Tone badge -----------------------------------------------------------
// "Well sourced" (mint) / "Thin evidence" (amber) — built on shadcn Badge,
// tones come from the design system's chart tokens (no hardcoded colors).

type BadgeTone = "mint" | "amber" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  mint: "border-chart-2/25 bg-chart-2/10 text-chart-2",
  amber: "border-chart-3/25 bg-chart-3/10 text-chart-3",
  neutral: "border-border bg-muted text-muted-foreground",
};

export const ToneBadge = ({
  tone = "neutral",
  className,
  ...props
}: React.ComponentProps<typeof Badge> & { tone?: BadgeTone }) => (
  <Badge variant="outline" className={cn(TONE_CLASSES[tone], className)} {...props} />
);

// --- Chip -----------------------------------------------------------------
// Suggestion / follow-up pill. Interactive when onClick is provided.
// `example` chips lead with a gold diamond (the base-date / evidence signal);
// follow-up chips lead with a return arrow, echoing the prototype.

type ChipVariant = "followup" | "example";

export const Chip = ({
  className,
  children,
  variant = "followup",
  ...props
}: React.ComponentProps<"button"> & { variant?: ChipVariant }) => (
  <button
    type="button"
    className={cn(
      "inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] font-medium text-foreground/80 transition-colors hover:border-primary hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
      className
    )}
    {...props}
  >
    <span
      aria-hidden
      className={cn(
        "font-bold",
        variant === "example" ? "text-[10px] text-seal" : "text-muted-foreground/50"
      )}
    >
      {variant === "example" ? "◆" : "↳"}
    </span>
    {children}
  </button>
);

// --- Seal -----------------------------------------------------------------
// Gold "base date" stamp — the evidence trust signal (the prototype's 직인).

export const Seal = ({ children, className, ...props }: React.ComponentProps<"span">) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border border-seal-border bg-seal-muted px-2.5 py-1 font-mono text-[11px] font-bold tracking-tight text-seal",
      className
    )}
    {...props}
  >
    <Stamp className="size-3" />
    {children}
  </span>
);

// --- Notice ---------------------------------------------------------------
// Advisory callout. `seal` tone is the gold "final confirmation" trust notice
// (the prototype's 최종 확인 안내); `neutral` is a plain muted advisory.

type NoticeTone = "neutral" | "seal";

export const Notice = ({
  className,
  children,
  tone = "neutral",
  ...props
}: React.ComponentProps<"div"> & { tone?: NoticeTone }) => {
  const Icon = tone === "seal" ? Stamp : Info;
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium",
        tone === "seal"
          ? "border-seal-border/70 bg-seal-muted text-highlight-foreground"
          : "border-border bg-muted/50 text-muted-foreground",
        className
      )}
      {...props}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "seal" ? "text-seal" : "text-muted-foreground"
        )}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
};

// --- Source card ----------------------------------------------------------
// A cited document. Shaped for the KHBA `document` fields.

export type ChatSource = {
  documentCode: string;
  title: string;
  authorityType: string;
  jurisdictionCode?: string | null;
  securityClass?: string;
  snippet?: string;
};

// Per-authority accent (spine gradient + type badge), theme-safe: ordinance =
// gold seal, law = neutral, everything else = brand. Mirrors the prototype's
// colour-coded .source spine and type badge.
type SourceAccent = { spine: string; badge: string };

const AUTHORITY_ACCENT: Record<string, SourceAccent> = {
  ORDINANCE: {
    spine: "bg-gradient-to-b from-seal to-seal-border",
    badge: "border-seal-border bg-seal-muted text-seal",
  },
  LAW: {
    spine: "bg-gradient-to-b from-muted-foreground/70 to-muted-foreground/35",
    badge: "border-border bg-muted text-muted-foreground",
  },
};

const DEFAULT_ACCENT: SourceAccent = {
  spine: "bg-gradient-to-b from-primary to-primary/55",
  badge: "border-primary/20 bg-primary/5 text-primary",
};

export const SourceCard = ({
  source,
  index,
  onOpen,
  viewSourceLabel = "View source",
}: {
  source: ChatSource;
  index?: number;
  onOpen?: () => void;
  viewSourceLabel?: string;
}) => {
  const accent = AUTHORITY_ACCENT[source.authorityType] ?? DEFAULT_ACCENT;

  return (
    <div className="grid grid-cols-[4px_1fr_auto] overflow-hidden rounded-xl border border-border bg-card transition-[box-shadow,border-color] hover:border-border/80 hover:shadow-sm">
      <span aria-hidden className={cn("h-full", accent.spine)} />

      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-col gap-1 px-4 py-3 text-left focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span className="flex flex-wrap items-center gap-2">
          {index != null && (
            <span className="grid size-[18px] flex-none place-items-center rounded-[5px] bg-foreground font-mono text-[11px] font-bold text-background">
              {index}
            </span>
          )}
          <span className="min-w-0 truncate text-sm font-bold text-foreground">{source.title}</span>
          <Badge
            variant="outline"
            className={cn("rounded-[5px] px-1.5 py-0 text-[11px]", accent.badge)}
          >
            {authorityLabel(source.authorityType)}
          </Badge>
        </span>

        {source.jurisdictionCode && (
          <span className="text-xs font-semibold text-foreground/70">
            {source.jurisdictionCode}
          </span>
        )}

        {source.snippet && (
          <span className="mt-1 line-clamp-2 border-l-2 border-border pl-2.5 text-[12.5px] leading-snug text-muted-foreground">
            <InlineMarkdown>{source.snippet}</InlineMarkdown>
          </span>
        )}
      </button>

      <div className="flex flex-col items-end justify-between gap-2 border-l border-border bg-muted/40 px-3 py-3">
        <span className="font-mono text-[10px] whitespace-nowrap text-muted-foreground">
          {source.documentCode}
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-0.5 text-xs font-bold whitespace-nowrap text-primary hover:underline focus-visible:outline-none"
        >
          {viewSourceLabel}
          <ArrowUpRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
};
