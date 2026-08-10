"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { useRouter } from "nextjs-toploader/app";

import { cn } from "@/lib/utils";
import { setLocale } from "@/app/actions/set-locale";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/constants/i18n.constant";

// KO / EN segmented toggle. Persists the choice via a cookie (server action),
// then refreshes so server components re-render in the new locale.
export const LocaleSwitcher = () => {
  const active = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const choose = (locale: Locale) => {
    if (locale === active || pending) return;
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  };

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center rounded-full border border-border bg-card p-0.5"
    >
      {LOCALES.map((locale) => {
        const selected = locale === active;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => choose(locale)}
            disabled={pending}
            aria-pressed={selected}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-bold transition-colors",
              selected
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {LOCALE_LABELS[locale]}
          </button>
        );
      })}
    </div>
  );
};
