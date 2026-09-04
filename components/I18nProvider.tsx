"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Dictionary } from "@/lib/dictionaries";
import { withCount, type Locale } from "@/lib/i18n";

type I18nValue = {
  lang: Locale;
  dict: Dictionary;
  /** Fills `{count}` and picks the singular or plural template. */
  plural: (one: string, many: string, count: number) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export default function I18nProvider({ lang, dict, children }: { lang: Locale; dict: Dictionary; children: ReactNode }) {
  const value = useMemo<I18nValue>(
    () => ({
      lang,
      dict,
      plural: (one, many, count) => withCount(count > 1 ? many : one, count, lang),
    }),
    [lang, dict],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside an I18nProvider");
  return value;
}
