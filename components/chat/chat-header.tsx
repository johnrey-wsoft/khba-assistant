"use client";

import { PanelLeft, Check, Folder } from "lucide-react";

import { Button } from "@/components/ui/button";

type ChatHeaderProps = {
  title?: string;
  subtitle?: string;
  baseDate?: string;
  messageCount: number;
  onToggleThreadList: () => void;
};

export const ChatHeader = ({
  title,
  subtitle,
  baseDate,
  messageCount,
  onToggleThreadList,
}: ChatHeaderProps) => {
  const heading = title ?? "New consultation";
  const meta = subtitle ?? "Ask about a statute, ordinance, or notice";

  return (
    <header className="flex flex-none items-center gap-3.5 border-b border-border bg-card/85 px-6 py-3 backdrop-blur">
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleThreadList}
        title="Toggle the thread list"
        aria-label="Toggle the thread list"
      >
        <PanelLeft />
      </Button>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base font-extrabold tracking-tight text-foreground">
          {heading}
        </span>
        <span className="truncate text-xs font-medium text-muted-foreground">
          {messageCount > 0 ? `${messageCount} messages · ${meta}` : meta}
        </span>
      </div>

      {baseDate && (
        <span className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground sm:flex">
          <span className="text-muted-foreground/70">Base date</span>
          <span className="tabular-nums text-foreground">{baseDate}</span>
        </span>
      )}

      <Button variant="outline" size="icon" title="Save this answer" aria-label="Save this answer">
        <Check />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="hidden sm:inline-flex"
        title="Sources in this thread"
        aria-label="Sources in this thread"
      >
        <Folder />
      </Button>
    </header>
  );
};
