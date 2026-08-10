import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALES,
  isLocale,
  type Locale,
} from "@/constants/i18n.constant";

// Pick the best locale we support from an Accept-Language header.
const detectFromHeader = (accept: string | null): Locale | null => {
  if (!accept) return null;
  const ranked = accept
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return null;
};

// Cookie-based i18n (no URL routing): prefer the saved cookie, else detect from
// the browser's Accept-Language, else fall back to the default locale.
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  let locale: Locale;
  if (isLocale(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const headerStore = await headers();
    locale = detectFromHeader(headerStore.get("accept-language")) ?? DEFAULT_LOCALE;
  }

  const messages = (await import(`@/messages/${locale}.json`)).default;
  return { locale, messages };
});

export { LOCALES };
