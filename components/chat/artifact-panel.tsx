"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/chat/primitives";
import type { ChatSource } from "@/components/chat/primitives";

const AUTHORITY_GLYPH: Record<string, string> = {
  LAW: "法",
  ORDINANCE: "条",
  GUIDELINE: "指",
};

const AUTHORITY_LABEL: Record<string, string> = {
  LAW: "Law / decree",
  ORDINANCE: "Local ordinance",
  GUIDELINE: "Guideline",
};

const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-3 py-2">
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    <span className="text-right text-sm font-semibold text-foreground">{value}</span>
  </div>
);

type ArtifactPanelProps = {
  source: ChatSource;
  onClose: () => void;
};

export const ArtifactPanel = ({ source, onClose }: ArtifactPanelProps) => {
  const glyph = AUTHORITY_GLYPH[source.authorityType] ?? "文";

  return (
    <aside className="flex h-full w-full max-w-[520px] flex-none flex-col border-l border-border bg-card duration-200 animate-in slide-in-from-right-4 fade-in">
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
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-foreground">
              {source.title}
            </h2>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 px-4 py-1">
            <MetaRow
              label="Type"
              value={AUTHORITY_LABEL[source.authorityType] ?? source.authorityType}
            />
            <MetaRow label="Document code" value={source.documentCode} />
            {source.jurisdictionCode && (
              <MetaRow label="Jurisdiction" value={source.jurisdictionCode} />
            )}
            <MetaRow label="Classification" value={source.securityClass ?? "PUBLIC"} />
          </div>

          {source.snippet && (
            <div className="flex flex-col gap-2.5">
              <span className="text-sm font-extrabold text-foreground">Cited passage</span>
              <blockquote className="rounded-xl border border-border border-l-4 border-l-primary bg-background px-4 py-3.5 text-base leading-relaxed font-medium text-foreground">
                {source.snippet}
              </blockquote>
            </div>
          )}

          <Notice>
            This is a reference excerpt from the KHBA index. Confirm the current wording against the
            official published text before relying on it.
          </Notice>
        </div>
      </div>
    </aside>
  );
};
