export const LOCALES = ["en", "ko"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ko";

export const LOCALE_COOKIE = "NEXT_LOCALE";

// One year, in seconds — the locale choice persists across visits.
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  ko: "KO",
};

export const isLocale = (value: string | undefined): value is Locale =>
  !!value && (LOCALES as readonly string[]).includes(value);
