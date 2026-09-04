"use client";

import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { localeCookie, localeCookieMaxAge, localeHref, localeLabels, locales } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { lang, dict } = useI18n();

  return (
    <div
      aria-label={dict.nav.languageAria}
      className="flex h-9 shrink-0 items-stretch border border-white/10 bg-white/[.025] font-[family-name:var(--font-geist-mono)] text-[10px] tracking-wider md:h-14"
      role="group"
    >
      {locales.map((locale) => {
        const isActive = locale === lang;

        return (
          <Link
            aria-current={isActive ? "true" : undefined}
            aria-label={locale === "en" ? dict.nav.switchToEnglish : dict.nav.switchToFrench}
            className={`flex items-center px-2.5 no-underline transition-colors duration-300 md:px-4 ${
              isActive
                ? "bg-[#86a98d]/15 text-[#dce9df]"
                : "text-white/35 hover:bg-white/[.06] hover:text-white/70"
            } focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-[#86a98d]`}
            href={localeHref(locale)}
            hrefLang={locale}
            key={locale}
            // Remember the choice so a later visit to `/` skips Accept-Language.
            onClick={() => {
              document.cookie = `${localeCookie}=${locale}; path=/; max-age=${localeCookieMaxAge}; samesite=lax`;
            }}
          >
            {localeLabels[locale]}
          </Link>
        );
      })}
    </div>
  );
}
