export const locales = ["en", "fr"] as const;

export type Locale = (typeof locales)[number];

/** English is served from the root, every other locale from its own prefix. */
export const defaultLocale: Locale = "en";

/** Remembers a manual choice so a later visit to `/` does not fall back to Accept-Language. */
export const localeCookie = "NEXT_LOCALE";

export const localeCookieMaxAge = 60 * 60 * 24 * 365;

export const localeLabels: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** `/` for the default locale, `/fr` for the others. */
export function localeHref(locale: Locale) {
  return locale === defaultLocale ? "/" : `/${locale}`;
}

/**
 * Picks the best supported locale out of an `Accept-Language` header,
 * honouring quality values and falling back to the default locale.
 */
export function matchAcceptLanguage(header: string | null): Locale {
  if (!header) return defaultLocale;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const quality = params.find((param) => param.trim().startsWith("q="));
      return {
        tag: tag.trim().toLowerCase(),
        quality: quality ? Number.parseFloat(quality.split("=")[1]) : 1,
      };
    })
    .filter(({ tag, quality }) => tag && Number.isFinite(quality) && quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    if (tag === "*") break;
    const language = tag.split("-")[0];
    if (isLocale(language)) return language;
  }

  return defaultLocale;
}

/** Replaces `{count}` and formats the number for the given locale. */
export function withCount(template: string, count: number, locale: Locale) {
  return template.replace("{count}", new Intl.NumberFormat(locale).format(count));
}
