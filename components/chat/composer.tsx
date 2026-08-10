"use client";

import { ArrowUp, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isBusy: boolean;
};

export const Composer = ({ value, onChange, onSubmit, onStop, isBusy }: ComposerProps) => {
  const canSend = value.trim().length > 0 && !isBusy;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSubmit();
    }
  };

  return (
    <div className="sticky bottom-0 bg-gradient-to-t from-background from-[16%] to-transparent px-7 pt-6 pb-5">
      <div className="mx-auto max-w-[820px]">
        <div className="flex items-end gap-2 rounded-[16px] border border-input bg-card py-2 pr-2 pl-4 shadow-sm transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/12">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask a follow-up. Adding the district and the case helps."
            className="max-h-30 min-h-0 resize-none border-none bg-transparent p-0 py-1.5 text-[15px] leading-relaxed shadow-none focus-visible:ring-0 md:text-[15px] dark:bg-transparent"
          />
          {isBusy ? (
            <Button
              size="icon"
              variant="secondary"
              className="size-10 rounded-[11px]"
              onClick={onStop}
              title="Stop"
              aria-label="Stop generating"
            >
              <Square className="fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="size-10 rounded-[11px]"
              onClick={onSubmit}
              disabled={!canSend}
              title="Send"
              aria-label="Send message"
            >
              <ArrowUp />
            </Button>
          )}
        </div>

        <p className="mt-2.5 text-center text-[11.5px] font-medium text-muted-foreground/70">
          Answers are reference material. The official text and the competent authority decide.
        </p>
      </div>
    </div>
  );
};
