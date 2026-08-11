"use client";

import { PanelLeft, Check, Folder } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { LocaleSwitcher } from "@/components/marketing/locale-switcher";

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
  const t = useTranslations("chat");
  const heading = title ?? t("newConsultation");
  const meta = subtitle ?? t("headerMetaFallback");

  return (
    <header className="flex flex-none items-center gap-3.5 border-b border-border bg-card/85 px-6 py-3 backdrop-blur">
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleThreadList}
        title={t("toggleThreads")}
        aria-label={t("toggleThreads")}
      >
        <PanelLeft />
      </Button>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base font-extrabold tracking-tight text-foreground">
          {heading}
        </span>
        <span className="truncate text-xs font-medium text-muted-foreground">
          {messageCount > 0 ? t("messagesMeta", { count: messageCount, meta }) : meta}
        </span>
      </div>

      {baseDate && (
        <span className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground sm:flex">
          <span className="text-muted-foreground/70">{t("baseDate")}</span>
          <span className="tabular-nums text-foreground">{baseDate}</span>
        </span>
      )}

      <Button variant="outline" size="icon" title={t("saveAnswer")} aria-label={t("saveAnswer")}>
        <Check />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="hidden sm:inline-flex"
        title={t("sourcesInThread")}
        aria-label={t("sourcesInThread")}
      >
        <Folder />
      </Button>

      <span className="mx-1 hidden h-6 w-px bg-border sm:block" />
      <LocaleSwitcher />
      <ModeToggle />
    </header>
  );
};
