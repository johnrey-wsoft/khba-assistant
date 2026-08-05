"use client";

import type { UIMessage } from "ai";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ThumbsUp, HelpCircle, Bookmark, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Notice, SourceCard, ToneBadge, type ChatSource } from "@/components/chat/primitives";
import { useArtifact } from "@/components/chat/artifact-context";
import { Markdown, type Citation } from "@/components/chat/markdown";

// useLayoutEffect on the client (scroll before paint = no flicker), useEffect
// on the server to avoid the SSR warning.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  const { openSource } = useArtifact();
  const text = getText(message);
  const sources = getSources(message);
  const citations: Citation[] = sources.map((source, i) => ({
    number: i + 1,
    source,
  }));
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
          <div className="text-base leading-relaxed font-medium text-foreground">
            <Markdown citations={citations} onCite={openSource}>
              {text}
            </Markdown>
          </div>
        )}

        {sources.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <span className="text-sm font-extrabold text-foreground">Where this came from</span>
            {sources.map((s) => (
              <SourceCard key={s.documentCode} source={s} onOpen={() => openSource(s)} />
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

export const ChatMessages = ({ messages, isThinking, dateLabel }: ChatMessagesProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom < 80;
    atBottomRef.current = atBottom;
    setShowScrollButton(!atBottom);
  };

  // Follow new/streaming content, but only if the user hasn't scrolled up.
  // Layout effect keeps the initial jump-to-bottom before paint (no flicker).
  useIsomorphicLayoutEffect(() => {
    if (atBottomRef.current) scrollToBottom("auto");
  }, [messages, isThinking, scrollToBottom]);

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto bg-background">
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

      <button
        type="button"
        onClick={() => {
          atBottomRef.current = true;
          setShowScrollButton(false);
          scrollToBottom("smooth");
        }}
        aria-label="Scroll to latest"
        className={cn(
          "absolute bottom-4 left-1/2 grid size-9 -translate-x-1/2 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition-all hover:bg-accent hover:text-accent-foreground",
          showScrollButton
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none translate-y-1 opacity-0"
        )}
      >
        <ChevronDown className="size-4" />
      </button>
    </div>
  );
};
