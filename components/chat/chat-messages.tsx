"use client";

import type { UIMessage } from "ai";
import { ThumbsUp, HelpCircle, Bookmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Notice, SourceCard, ToneBadge, type ChatSource } from "@/components/chat/primitives";

type Part = UIMessage["parts"][number];

const isTextPart = (p: Part): p is Extract<Part, { type: "text" }> => p.type === "text";

const getText = (message: UIMessage) =>
  message.parts
    .filter(isTextPart)
    .map((p) => p.text)
    .join("");

const getSources = (message: UIMessage): ChatSource[] => {
  const sources: ChatSource[] = [];
  for (const part of message.parts) {
    if (part.type === "tool-searchKhba" && "state" in part && part.state === "output-available") {
      const output = (part as { output?: { results?: ChatSource[] } }).output;
      if (output?.results) sources.push(...output.results);
    }
  }
  return sources;
};

const getTime = (message: UIMessage): string | undefined =>
  (message.metadata as { time?: string } | undefined)?.time;

const DateDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3">
    <span className="h-px flex-1 bg-border" />
    <span className="font-mono text-xs font-bold tabular-nums text-muted-foreground">{label}</span>
    <span className="h-px flex-1 bg-border" />
  </div>
);

const KhbaAvatar = () => (
  <span className="grid size-8 flex-none place-items-center rounded-lg bg-primary text-sm font-extrabold text-primary-foreground">
    KH
  </span>
);

const UserMessage = ({ text, time }: { text: string; time?: string }) => (
  <div className="flex flex-col items-end gap-1.5">
    <div className="w-fit max-w-[80%] rounded-[18px_18px_4px_18px] bg-primary px-4.5 py-3 text-primary-foreground">
      {text}
    </div>
    {time && <span className="font-mono text-xs tabular-nums text-muted-foreground">{time}</span>}
  </div>
);

const AssistantMessage = ({ message }: { message: UIMessage }) => {
  const text = getText(message);
  const sources = getSources(message);
  const time = getTime(message);
  const sourceLabel =
    sources.length > 0 ? `${sources.length} ${sources.length === 1 ? "source" : "sources"}` : null;
  const footerMeta = [time, sourceLabel].filter(Boolean).join(" · ");

  return (
    <div className="overflow-hidden rounded-[16px_16px_16px_4px] border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-border bg-muted/40 px-5 py-3.5">
        <KhbaAvatar />
        <span className="text-sm font-extrabold text-foreground">KHBA Assistant</span>
        <span className="flex-1" />
        {sources.length > 0 && <ToneBadge tone="mint">Well sourced</ToneBadge>}
      </div>

      <div className="flex flex-col gap-5 p-6">
        {text && (
          <p className="text-base leading-relaxed font-medium whitespace-pre-wrap text-foreground">
            {text}
          </p>
        )}

        {sources.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <span className="text-sm font-extrabold text-foreground">Where this came from</span>
            {sources.map((s) => (
              <SourceCard key={s.documentCode} source={s} />
            ))}
          </div>
        )}

        <Notice>
          Answers are reference material. Confirm the current wording with the official text and the
          competent authority before filing.
        </Notice>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button variant="outline" size="sm" className="rounded-full text-muted-foreground">
            <ThumbsUp />
            Helpful
          </Button>
          <Button variant="outline" size="sm" className="rounded-full text-muted-foreground">
            <HelpCircle />
            Not quite
          </Button>
          <Button variant="outline" size="sm" className="rounded-full text-muted-foreground">
            <Bookmark />
            Save
          </Button>
          <span className="flex-1" />
          {footerMeta && (
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {footerMeta}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ThinkingBubble = () => (
  <div className="flex w-fit items-center gap-2.5 rounded-[16px_16px_16px_4px] border border-border bg-card px-5 py-3.5">
    <KhbaAvatar />
    <span className="text-sm text-muted-foreground">Checking the ordinance and the decree</span>
    <span className="flex gap-1">
      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.15s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/40" />
    </span>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-1 flex-col items-center justify-center gap-2 py-20 text-center">
    <span className="grid size-12 place-items-center rounded-xl bg-primary text-lg font-extrabold text-primary-foreground">
      KH
    </span>
    <p className="text-base font-bold text-foreground">
      Ask about a statute, ordinance, or notice.
    </p>
    <p className="max-w-sm text-sm text-muted-foreground">
      Adding the district and the case helps the assistant ground its answer in the right document.
    </p>
  </div>
);

type ChatMessagesProps = {
  messages: UIMessage[];
  isThinking: boolean;
  dateLabel?: string;
};

export const ChatMessages = ({ messages, isThinking, dateLabel }: ChatMessagesProps) => (
  <div className="min-h-0 flex-1 overflow-y-auto bg-background">
    <div className="mx-auto flex max-w-[820px] flex-col gap-4.5 px-7 py-7">
      {messages.length === 0 && !isThinking ? (
        <EmptyState />
      ) : (
        <>
          {dateLabel && messages.length > 0 && <DateDivider label={dateLabel} />}
          {messages.map((message) =>
            message.role === "user" ? (
              <UserMessage key={message.id} text={getText(message)} time={getTime(message)} />
            ) : (
              <AssistantMessage key={message.id} message={message} />
            )
          )}
        </>
      )}
      {isThinking && <ThinkingBubble />}
    </div>
  </div>
);
