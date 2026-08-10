"use client";

import type { UIMessage } from "ai";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ThumbsUp, HelpCircle, Flag, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Chip, Notice, SourceCard, type ChatSource } from "@/components/chat/primitives";
import { useArtifact } from "@/components/chat/artifact-context";
import { Markdown, type Citation } from "@/components/chat/markdown";
import type { ChatExample } from "@/constants/chat.constant";

// useLayoutEffect on the client (scroll before paint = no flicker), useEffect
// on the server to avoid the SSR warning.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Part = UIMessage["parts"][number];

const isTextPart = (p: Part): p is Extract<Part, { type: "text" }> => p.type === "text";
const isToolPart = (p: Part): boolean => p.type.startsWith("tool-");

// The answer is the text the model emits AFTER its last tool call. A tool-loop
// turn can produce text between searches (retries, thinking); concatenating all
// of it doubles the summary. Take only the trailing answer. (User messages have
// no tool parts, so this returns their full text.)
const getText = (message: UIMessage): string => {
  const parts = message.parts;
  let lastToolIdx = -1;
  parts.forEach((p, i) => {
    if (isToolPart(p)) lastToolIdx = i;
  });
  return parts
    .slice(lastToolIdx + 1)
    .filter(isTextPart)
    .map((p) => p.text)
    .join("");
};

// Collect cited documents across every searchKhba call in the turn, de-duped by
// documentCode so the same source is never shown (or keyed) twice.
const getSources = (message: UIMessage): ChatSource[] => {
  const sources: ChatSource[] = [];
  const seen = new Set<string>();
  for (const part of message.parts) {
    if (part.type === "tool-searchKhba" && "state" in part && part.state === "output-available") {
      const output = (part as { output?: { results?: ChatSource[] } }).output;
      for (const result of output?.results ?? []) {
        if (seen.has(result.documentCode)) continue;
        seen.add(result.documentCode);
        sources.push(result);
      }
    }
  }
  return sources;
};

const getTime = (message: UIMessage): string | undefined =>
  (message.metadata as { time?: string } | undefined)?.time;

// True while a searchKhba tool call is executing (input states, before output).
const isSearching = (message: UIMessage): boolean =>
  message.parts.some(
    (p) =>
      p.type === "tool-searchKhba" &&
      "state" in p &&
      (p.state === "input-streaming" || p.state === "input-available")
  );

const SourcesSkeleton = () => (
  <div className="flex flex-col gap-2.5">
    <span className="flex items-center gap-2 text-sm font-extrabold text-foreground">
      <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
      Searching sources…
    </span>
    {[0, 1].map((i) => (
      <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5">
        <Skeleton className="size-10 flex-none rounded-lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    ))}
  </div>
);

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

// Show this many source cards before collapsing the rest behind "See all".
const SOURCE_PREVIEW_COUNT = 3;

// The prototype answer is a summary sentence, then a bullet list of key points.
// Split the streamed markdown at the first list item: everything before is the
// summary, the list is the body. Streaming-safe (the split point is stable once
// the first bullet arrives).
const splitAnswer = (md: string): { summary: string; body: string } => {
  const lines = md.split("\n");
  const idx = lines.findIndex((l) => /^\s*([-*]|\d+\.)\s+/.test(l));
  if (idx === -1) return { summary: md.trim(), body: "" };
  return {
    summary: lines.slice(0, idx).join("\n").trim(),
    body: lines.slice(idx).join("\n").trim(),
  };
};

// Small uppercase section label (the prototype's .answer__label).
const AnswerLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[11.5px] font-extrabold tracking-[0.1em] text-muted-foreground/70 uppercase">
    {children}
  </span>
);

type Feedback = "up" | "down" | "report" | null;

const FeedbackBar = ({ meta }: { meta?: string }) => {
  const [value, setValue] = useState<Feedback>(null);
  const pill =
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors";
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
      <button
        type="button"
        onClick={() => setValue("up")}
        className={cn(
          pill,
          value === "up"
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
        )}
      >
        <ThumbsUp className="size-3.5" />
        Helpful
      </button>
      <button
        type="button"
        onClick={() => setValue("down")}
        className={cn(
          pill,
          value === "down"
            ? "border-destructive bg-destructive/10 text-destructive"
            : "border-border bg-card text-muted-foreground hover:border-destructive hover:text-destructive"
        )}
      >
        <HelpCircle className="size-3.5" />
        Not quite
      </button>
      <button
        type="button"
        onClick={() => setValue("report")}
        className={cn(
          pill,
          value === "report"
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
        )}
      >
        <Flag className="size-3.5" />
        Report
      </button>
      <span className="flex-1" />
      {value ? (
        <span className="text-xs font-semibold text-chart-2">Feedback saved</span>
      ) : (
        meta && (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{meta}</span>
        )
      )}
    </div>
  );
};

const FOLLOWUP_SKELETONS = ["w-52", "w-44", "w-48"];

type AssistantMessageProps = {
  message: UIMessage;
  followups?: string[];
  loadingFollowups?: boolean;
  onFollowup?: (value: string) => void;
};

const AssistantMessage = ({
  message,
  followups = [],
  loadingFollowups = false,
  onFollowup,
}: AssistantMessageProps) => {
  const { openSource } = useArtifact();
  const [showAllSources, setShowAllSources] = useState(false);
  const text = getText(message);
  const { summary, body } = splitAnswer(text);
  const sources = getSources(message);
  const citations: Citation[] = sources.map((source, i) => ({
    number: i + 1,
    source,
  }));
  const visibleSources = showAllSources ? sources : sources.slice(0, SOURCE_PREVIEW_COUNT);
  const hiddenSourceCount = sources.length - SOURCE_PREVIEW_COUNT;
  const time = getTime(message);
  const searching = isSearching(message);
  const hasContent = Boolean(text) || sources.length > 0;
  const sourceLabel =
    sources.length > 0 ? `${sources.length} ${sources.length === 1 ? "source" : "sources"}` : null;
  const footerMeta = [time, sourceLabel].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-5 rounded-[16px_16px_16px_4px] border border-border bg-card p-6 shadow-sm">
      {summary && (
        <div className="border-l-[3px] border-primary pl-4 text-base leading-relaxed font-semibold text-foreground">
          <Markdown citations={citations} onCite={openSource}>
            {summary}
          </Markdown>
        </div>
      )}

      {body && (
        <div className="flex flex-col gap-2.5">
          <AnswerLabel>Key points</AnswerLabel>
          <div className="text-[15px] leading-relaxed text-foreground [&_li]:marker:text-primary [&_ul]:mb-0">
            <Markdown citations={citations} onCite={openSource}>
              {body}
            </Markdown>
          </div>
        </div>
      )}

      {searching && sources.length === 0 && <SourcesSkeleton />}

      {sources.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <AnswerLabel>Sources · grounding</AnswerLabel>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {sources.length}
            </span>
          </div>
          {visibleSources.map((s, i) => (
            <SourceCard key={s.documentCode} source={s} index={i + 1} onOpen={() => openSource(s)} />
          ))}
          {sources.length > SOURCE_PREVIEW_COUNT && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllSources((v) => !v)}
              className="self-start rounded-full text-muted-foreground"
            >
              {showAllSources ? "Show fewer" : `See all ${sources.length} sources`}
              {showAllSources ? (
                <ChevronUp className="size-4" />
              ) : (
                <span className="font-mono text-xs tabular-nums">+{hiddenSourceCount}</span>
              )}
            </Button>
          )}
        </div>
      )}

      {hasContent && (
        <Notice tone="seal">
          <span className="font-bold text-seal">Final check</span> — this reflects the base date
          shown. Confirm the current wording with the official text and the competent authority
          before filing.
        </Notice>
      )}

      {hasContent && (loadingFollowups || followups.length > 0) && (
        <div className="flex flex-col gap-2.5">
          <AnswerLabel>Ask next</AnswerLabel>
          <div className="flex flex-wrap gap-2">
            {loadingFollowups
              ? FOLLOWUP_SKELETONS.map((w, i) => (
                  <Skeleton key={i} className={`h-8 rounded-full ${w}`} />
                ))
              : followups.map((f, i) => (
                  <Chip key={`${i}-${f}`} onClick={() => onFollowup?.(f)}>
                    {f}
                  </Chip>
                ))}
          </div>
        </div>
      )}

      {hasContent && <FeedbackBar meta={footerMeta} />}
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

const EmptyState = ({
  examples = [],
  onExample,
}: {
  examples?: ChatExample[];
  onExample?: (value: string) => void;
}) => (
  <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
    <span className="mb-6 grid size-11 place-items-center rounded-xl bg-primary text-base font-extrabold text-primary-foreground">
      KH
    </span>
    <h1 className="text-[clamp(24px,4vw,32px)] leading-tight font-extrabold tracking-tight text-foreground">
      What can I confirm <span className="text-primary">with the sources</span>?
    </h1>
    <p className="mt-3 max-w-md text-sm text-muted-foreground">
      I search approved association materials, notices, and statutes — and answer with the source
      and its base date alongside.
    </p>
    {examples.length > 0 && (
      <div className="mt-7 flex max-w-xl flex-wrap justify-center gap-2.5">
        {examples.map((ex) => (
          <Chip key={ex.label} variant="example" onClick={() => onExample?.(ex.prompt)}>
            {ex.label}
          </Chip>
        ))}
      </div>
    )}
  </div>
);

type ChatMessagesProps = {
  messages: UIMessage[];
  isThinking: boolean;
  dateLabel?: string;
  examples?: ChatExample[];
  onExample?: (value: string) => void;
  suggestions?: string[];
  loadingSuggestions?: boolean;
  onSuggestion?: (value: string) => void;
};

export const ChatMessages = ({
  messages,
  isThinking,
  dateLabel,
  examples,
  onExample,
  suggestions = [],
  loadingSuggestions = false,
  onSuggestion,
}: ChatMessagesProps) => {
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
            <EmptyState examples={examples} onExample={onExample} />
          ) : (
            <>
              {dateLabel && messages.length > 0 && <DateDivider label={dateLabel} />}
              {messages.map((message, i) => {
                if (message.role === "user") {
                  return (
                    <UserMessage key={message.id} text={getText(message)} time={getTime(message)} />
                  );
                }
                // Follow-ups belong to the latest completed answer (the prototype
                // shows "다음으로 물어볼 만한 질문" inside that card).
                const isLatestAnswer = i === messages.length - 1;
                return (
                  <AssistantMessage
                    key={message.id}
                    message={message}
                    followups={isLatestAnswer ? suggestions : []}
                    loadingFollowups={isLatestAnswer && loadingSuggestions}
                    onFollowup={onSuggestion}
                  />
                );
              })}
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
