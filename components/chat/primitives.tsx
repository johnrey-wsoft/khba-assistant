import * as React from "react";
import { Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

export const Chip = ({ className, ...props }: React.ComponentProps<"button">) => (
  <button
    type="button"
    className={cn(
      "inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
      className
    )}
    {...props}
  />
);

// --- Notice ---------------------------------------------------------------
// Advisory callout ("confirm the official text …").

export const Notice = ({ className, children, ...props }: React.ComponentProps<"div">) => (
  <div
    className={cn(
      "flex gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3.5 text-sm font-medium text-muted-foreground",
      className
    )}
    {...props}
  >
    <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
    <div className="min-w-0">{children}</div>
  </div>
);

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

const AUTHORITY_GLYPH: Record<string, string> = {
  LAW: "法",
  ORDINANCE: "条",
  GUIDELINE: "指",
};

export const SourceCard = ({ source }: { source: ChatSource }) => {
  const glyph = AUTHORITY_GLYPH[source.authorityType] ?? "文";

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors hover:bg-accent/40">
      <span className="grid size-10 flex-none place-items-center rounded-lg bg-accent text-lg font-bold text-accent-foreground">
        {glyph}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-bold text-foreground">{source.title}</span>
        <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span>{source.documentCode}</span>
          {source.jurisdictionCode ? (
            <>
              <span aria-hidden>·</span>
              <span>{source.jurisdictionCode}</span>
            </>
          ) : null}
        </span>
        {source.snippet ? (
          <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{source.snippet}</span>
        ) : null}
      </div>
    </div>
  );
};
