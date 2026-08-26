"use client";

import type { UIMessage } from "ai";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ThumbsUp, HelpCircle, Flag, ChevronDown, ChevronUp, Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Chip, Notice, SourceCard, type ChatSource } from "@/components/chat/primitives";
import { useArtifact } from "@/components/chat/artifact-context";
import { Markdown, type Citation } from "@/components/chat/markdown";
import { chatsService } from "@/services/chats.service";
import type { MessageFeedbackRating } from "@/drizzle/schemas/chats/message-feedback.schema";
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

// True once the searchKhba call has returned (output available).
const hasSearchOutput = (message: UIMessage): boolean =>
  message.parts.some(
    (p) => p.type === "tool-searchKhba" && "state" in p && p.state === "output-available"
  );

// The evidence-search steps, mirroring the prototype's "근거 검색 단계".
const SEARCH_STEP_KEYS = ["received", "searching", "checking", "drafting"] as const;

// Stepped loader: steps before `activeStep` are done (filled check), the current
// one pulses, the rest wait — the prototype's evidence-search progress.
const SearchSteps = ({ activeStep }: { activeStep: number }) => {
  const t = useTranslations("chat.steps");
  return (
    <div className="flex flex-col gap-2.5 rounded-[16px_16px_16px_4px] border border-border bg-card p-5 shadow-sm">
      {SEARCH_STEP_KEYS.map((key, i) => {
        const done = i < activeStep;
        const active = i === activeStep;
        return (
          <div
            key={key}
            className={cn(
              "flex items-center gap-2.5 text-[13px] transition-colors",
              active ? "font-semibold text-foreground" : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "grid size-4 flex-none place-items-center rounded-full border-2 transition-colors",
                done ? "border-chart-2 bg-chart-2" : active ? "border-primary" : "border-border"
              )}
            >
              {done ? (
                <Check className="size-2.5 text-white" strokeWidth={3.5} />
              ) : active ? (
                <span className="size-1.5 animate-pulse rounded-full bg-primary" />
              ) : null}
            </span>
            {t(key)}
          </div>
        );
      })}
    </div>
  );
};

const DateDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3">
    <span className="h-px flex-1 bg-border" />
    <span className="font-mono text-xs font-bold tabular-nums text-muted-foreground">{label}</span>
    <span className="h-px flex-1 bg-border" />
  </div>
);

const UserMessage = ({ id, text, time }: { id?: string; text: string; time?: string }) => (
  <div data-mid={id} className="flex flex-col items-end gap-1.5">
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

const FeedbackBar = ({
  meta,
  chatId,
  messageId,
  initial = null,
}: {
  meta?: string;
  chatId?: string;
  messageId?: string;
  initial?: Feedback;
}) => {
  const [value, setValue] = useState<Feedback>(initial);
  const t = useTranslations("chat");
  const pill =
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors";

  // Toggle a rating (clicking the active one clears it), persist optimistically,
  // and roll back on failure. Only persists for saved chats with a message id.
  const choose = (next: Exclude<Feedback, null>) => {
    const nextValue: Feedback = value === next ? null : next;
    const prev = value;
    setValue(nextValue);
    if (!chatId || !messageId) return;
    void chatsService
      .saveFeedback(chatId, messageId, nextValue as MessageFeedbackRating | null)
      .then((ok) => {
        if (!ok) {
          setValue(prev);
          toast.error(t("actionError"));
        }
      });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
      <button
        type="button"
        onClick={() => choose("up")}
        className={cn(
          pill,
          value === "up"
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
        )}
      >
        <ThumbsUp className="size-3.5" />
        {t("helpful")}
      </button>
      <button
        type="button"
        onClick={() => choose("down")}
        className={cn(
          pill,
          value === "down"
            ? "border-destructive bg-destructive/10 text-destructive"
            : "border-border bg-card text-muted-foreground hover:border-destructive hover:text-destructive"
        )}
      >
        <HelpCircle className="size-3.5" />
        {t("notQuite")}
      </button>
      <button
        type="button"
        onClick={() => choose("report")}
        className={cn(
          pill,
          value === "report"
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
        )}
      >
        <Flag className="size-3.5" />
        {t("report")}
      </button>
      <span className="flex-1" />
      {value ? (
        <span className="text-xs font-semibold text-chart-2">{t("feedbackSaved")}</span>
      ) : (
        meta && <span className="font-mono text-xs tabular-nums text-muted-foreground">{meta}</span>
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
  chatId?: string;
  feedback?: Feedback;
};

const AssistantMessage = ({
  message,
  followups = [],
  loadingFollowups = false,
  onFollowup,
  chatId,
  feedback = null,
}: AssistantMessageProps) => {
  const { openSource } = useArtifact();
  const t = useTranslations("chat");
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
  const hasContent = Boolean(text) || sources.length > 0;
  const sourceLabel = sources.length > 0 ? t("sourceCount", { count: sources.length }) : null;
  const footerMeta = [time, sourceLabel].filter(Boolean).join(" · ");

  // Before any answer text streams in, show the evidence-search steps: the
  // search is running (step 1) or has returned and we're drafting (step 3).
  if (!text) {
    const activeStep = isSearching(message) ? 1 : hasSearchOutput(message) ? 3 : 1;
    return <SearchSteps activeStep={activeStep} />;
  }

  return (
    <div className="flex flex-col gap-5 rounded-[16px_16px_16px_4px] border border-border bg-card p-6 shadow-sm">
      {summary && (
        <div className="border-l-[3px] border-primary pl-4 text-base leading-relaxed font-semibold text-foreground">
          <Markdown citations={citations} onCite={(src) => openSource(src, sources)}>
            {summary}
          </Markdown>
        </div>
      )}

      {body && (
        <div className="flex flex-col gap-2.5">
          <AnswerLabel>{t("keyPoints")}</AnswerLabel>
          <div className="text-[15px] leading-relaxed text-foreground [&_li]:marker:text-primary [&_ul]:mb-0">
            <Markdown citations={citations} onCite={(src) => openSource(src, sources)}>
              {body}
            </Markdown>
          </div>
        </div>
      )}

      {sources.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <AnswerLabel>{t("sources")}</AnswerLabel>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {sources.length}
            </span>
          </div>
          {visibleSources.map((s, i) => (
            <SourceCard
              key={s.documentCode}
              source={s}
              index={i + 1}
              viewSourceLabel={t("viewSource")}
              onOpen={() => openSource(s, sources)}
            />
          ))}
          {sources.length > SOURCE_PREVIEW_COUNT && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllSources((v) => !v)}
              className="self-start rounded-full text-muted-foreground"
            >
              {showAllSources ? t("showFewer") : t("seeAll", { count: sources.length })}
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
          <span className="font-bold text-seal">{t("finalCheck")}</span> — {t("answerNotice")}
        </Notice>
      )}

      {hasContent && (loadingFollowups || followups.length > 0) && (
        <div className="flex flex-col gap-2.5">
          <AnswerLabel>{t("askNext")}</AnswerLabel>
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

      {hasContent && (
        <FeedbackBar meta={footerMeta} chatId={chatId} messageId={message.id} initial={feedback} />
      )}
    </div>
  );
};

const EmptyState = ({
  examples = [],
  onExample,
}: {
  examples?: ChatExample[];
  onExample?: (value: string) => void;
}) => {
  const t = useTranslations("chat");
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <span className="mb-6 grid size-11 place-items-center rounded-xl bg-primary text-base font-extrabold text-primary-foreground">
        KH
      </span>
      <h1 className="text-[clamp(24px,4vw,32px)] leading-tight font-extrabold tracking-tight text-foreground">
        {t.rich("emptyTitle", {
          hl: (c) => <span className="text-primary">{c}</span>,
        })}
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">{t("emptyLede")}</p>
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
};

type ChatMessagesProps = {
  messages: UIMessage[];
  isThinking: boolean;
  dateLabel?: string;
  examples?: ChatExample[];
  onExample?: (value: string) => void;
  suggestions?: string[];
  loadingSuggestions?: boolean;
  onSuggestion?: (value: string) => void;
  chatId?: string;
  initialFeedback?: Record<string, MessageFeedbackRating>;
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
  chatId,
  initialFeedback,
}: ChatMessagesProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const anchoredRef = useRef<string | null>(null);
  const firstRunRef = useRef(true);
  const [reserve, setReserve] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const TOP_GAP = 16; // px kept above the pinned question

  // The turn to anchor: the most recent user message.
  const lastUserId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") return messages[i].id;
    }
    return null;
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content) return;
    const belowFold = content.offsetHeight - el.scrollTop - el.clientHeight;
    setShowScrollButton(belowFold > 120);
  };

  const scrollToLatest = () => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content) return;
    el.scrollTo({ top: Math.max(0, content.offsetHeight - el.clientHeight), behavior: "smooth" });
  };

  // Pin the latest question near the top of the viewport and let its answer
  // stream in below — instead of chasing the bottom. A spacer reserves just
  // enough room to reach the top, and shrinks as the answer grows.
  useIsomorphicLayoutEffect(() => {
    const container = scrollRef.current;
    const content = contentRef.current;
    if (!container || !content || !lastUserId) return;
    const target = content.querySelector<HTMLElement>(`[data-mid="${lastUserId}"]`);
    if (!target) return;

    const userTop = target.offsetTop;
    const belowUser = content.offsetHeight - userTop;
    setReserve(Math.max(0, container.clientHeight - belowUser - TOP_GAP));

    // Scroll only when the turn is new — never mid-stream, so the user can read
    // and scroll freely while the answer fills in below.
    if (anchoredRef.current !== lastUserId) {
      anchoredRef.current = lastUserId;
      const behavior: ScrollBehavior = firstRunRef.current ? "auto" : "smooth";
      firstRunRef.current = false;
      requestAnimationFrame(() => {
        container.scrollTo({ top: Math.max(0, userTop - TOP_GAP), behavior });
      });
    }
  }, [messages, isThinking, lastUserId]);

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto bg-background">
        <div
          ref={contentRef}
          className="relative mx-auto flex max-w-[820px] flex-col gap-4.5 px-7 py-7"
        >
          {messages.length === 0 && !isThinking ? (
            <EmptyState examples={examples} onExample={onExample} />
          ) : (
            <>
              {dateLabel && messages.length > 0 && <DateDivider label={dateLabel} />}
              {messages.map((message, i) => {
                if (message.role === "user") {
                  return (
                    <UserMessage
                      key={message.id}
                      id={message.id}
                      text={getText(message)}
                      time={getTime(message)}
                    />
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
                    chatId={chatId}
                    feedback={initialFeedback?.[message.id] ?? null}
                  />
                );
              })}
            </>
          )}
          {isThinking && <SearchSteps activeStep={1} />}
        </div>
        {/* Reserved room so the newest question can sit at the top while its
            answer streams; collapses to nothing once the turn fills the view. */}
        <div aria-hidden style={{ height: reserve }} />
      </div>

      <button
        type="button"
        onClick={scrollToLatest}
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
