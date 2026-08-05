"use client";

import { ArrowUp, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Chip } from "@/components/chat/primitives";

const SKELETON_WIDTHS = ["w-44", "w-36", "w-40", "w-32"];

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onSuggestion: (value: string) => void;
  onStop: () => void;
  isBusy: boolean;
  suggestions: string[];
  loadingSuggestions?: boolean;
};

export const Composer = ({
  value,
  onChange,
  onSubmit,
  onSuggestion,
  onStop,
  isBusy,
  suggestions,
  loadingSuggestions = false,
}: ComposerProps) => {
  const canSend = value.trim().length > 0 && !isBusy;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSubmit();
    }
  };

  return (
    <div className="sticky bottom-0 bg-gradient-to-t from-background from-[16%] to-transparent px-7 pt-6 pb-5.5">
      <div className="mx-auto max-w-[820px]">
        <div
          className="mb-3 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none]"
          style={{
            maskImage: "linear-gradient(90deg, #000 calc(100% - 28px), transparent)",
            WebkitMaskImage: "linear-gradient(90deg, #000 calc(100% - 28px), transparent)",
          }}
        >
          {loadingSuggestions
            ? SKELETON_WIDTHS.map((w, i) => (
                <Skeleton key={i} className={`h-9 flex-none rounded-full ${w}`} />
              ))
            : suggestions.map((s, i) => (
                <Chip key={`${i}-${s}`} onClick={() => onSuggestion(s)} disabled={isBusy}>
                  {s}
                </Chip>
              ))}
        </div>

        <div className="flex items-end gap-2.5 rounded-2xl border-2 border-primary bg-card p-3 pl-4.5 shadow-sm">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask a follow-up. Adding the district and the case helps."
            className="max-h-30 min-h-0 resize-none border-none bg-transparent p-0 py-2 text-base shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          {isBusy ? (
            <Button
              size="icon"
              variant="secondary"
              className="size-11 rounded-xl"
              onClick={onStop}
              title="Stop"
              aria-label="Stop generating"
            >
              <Square className="fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="size-11 rounded-xl"
              onClick={onSubmit}
              disabled={!canSend}
              title="Send"
              aria-label="Send message"
            >
              <ArrowUp />
            </Button>
          )}
        </div>

        <p className="mt-2.5 text-[13px] font-medium text-muted-foreground">
          Answers are reference material. The official text and the competent authority decide.
        </p>
      </div>
    </div>
  );
};
