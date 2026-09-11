"use client";

import { useEffect, useRef, useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/components/I18nProvider";

/** Burger menu shown only on mobile, collapsing the store badges + language switcher. */
export default function MobileMenu() {
  const { dict } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative shrink-0 md:hidden" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={dict.nav.menuAria}
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border border-white/10 bg-white/[.025] text-white/70 transition-colors hover:border-white/25 hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#86a98d]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <svg aria-hidden="true" className="size-4 fill-none stroke-current stroke-[1.6]" viewBox="0 0 20 20">
          {open ? (
            <path className="[stroke-linecap:round]" d="M5 5l10 10M15 5 5 15" />
          ) : (
            <path className="[stroke-linecap:round]" d="M3 5.5h14M3 10h14M3 14.5h14" />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 z-30 mt-2 w-72 border border-white/15 bg-[rgba(15,20,17,.94)] p-3 shadow-[0_18px_50px_rgba(0,0,0,.5)] backdrop-blur-xl" role="menu">
          <div className="flex flex-col gap-2">
            <button className="flex h-12 min-w-0 cursor-not-allowed items-center gap-3 border border-white/10 bg-white/[.025] px-4 text-left text-white/35 grayscale" disabled title={dict.stores.discordTitle} type="button">
              <svg aria-hidden="true" className="size-5 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M20.32 5.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.45.86-.61 1.24a18.3 18.3 0 0 0-5.48 0 12.6 12.6 0 0 0-.62-1.24.08.08 0 0 0-.08-.04c-1.7.29-3.34.8-4.89 1.52a.07.07 0 0 0-.03.03C1.58 9.05.86 12.62 1.21 16.14a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-2a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1 0-.13c.13-.09.25-.19.37-.28a.07.07 0 0 1 .08 0c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08.01c.12.1.24.19.37.28a.08.08 0 0 1 0 .13c-.6.35-1.22.65-1.87.89a.08.08 0 0 0-.04.11c.36.7.78 1.37 1.23 2a.08.08 0 0 0 .08.03 19.8 19.8 0 0 0 6-3.03.08.08 0 0 0 .03-.06c.42-4.07-.7-7.6-2.96-10.74a.06.06 0 0 0-.03-.03ZM8.68 14a1.18 1.18 0 0 1 0-2.37c.66 0 1.19.55 1.18 1.19 0 .65-.52 1.18-1.18 1.18Zm6.65 0a1.18 1.18 0 0 1 0-2.37c.66 0 1.19.55 1.18 1.19 0 .65-.51 1.18-1.18 1.18Z" />
              </svg>
              <span className="min-w-0 font-[family-name:var(--font-geist-mono)] text-[10px] leading-4 tracking-wider">
                <span className="block text-[9px] text-white/25">{dict.stores.soonOn}</span>
                {dict.stores.discord}
              </span>
            </button>
            <button className="flex h-12 min-w-0 cursor-not-allowed items-center gap-3 border border-white/10 bg-white/[.025] px-4 text-left text-white/35 grayscale" disabled title={dict.stores.appStoreTitle} type="button">
              <svg aria-hidden="true" className="size-5 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M17.05 12.54c-.03-3.08 2.52-4.58 2.64-4.65a5.68 5.68 0 0 0-4.48-2.42c-1.88-.2-3.7 1.13-4.66 1.13-.98 0-2.46-1.11-4.05-1.08a5.93 5.93 0 0 0-4.99 3.05c-2.16 3.74-.55 9.23 1.52 12.25 1.04 1.48 2.25 3.13 3.84 3.07 1.56-.06 2.14-.99 4.02-.99 1.86 0 2.41.99 4.03.95 1.67-.02 2.72-1.48 3.72-2.98a12.2 12.2 0 0 0 1.7-3.47 5.34 5.34 0 0 1-3.29-4.86ZM13.98 3.48A5.4 5.4 0 0 0 15.21 0a5.5 5.5 0 0 0-3.56 1.65 5.16 5.16 0 0 0-1.27 3.34 4.55 4.55 0 0 0 3.6-1.51Z" />
              </svg>
              <span className="min-w-0 font-[family-name:var(--font-geist-mono)] text-[10px] leading-4 tracking-wider">
                <span className="block text-[9px] text-white/25">{dict.stores.soonOn}</span>
                {dict.stores.appStore}
              </span>
            </button>
            <button className="flex h-12 min-w-0 cursor-not-allowed items-center gap-3 border border-white/10 bg-white/[.025] px-4 text-left text-white/35 grayscale" disabled title={dict.stores.googlePlayTitle} type="button">
              <svg aria-hidden="true" className="size-5 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M3.6 2.25a1.7 1.7 0 0 0-.35 1.04v17.42c0 .4.13.76.35 1.04l9.55-9.75L3.6 2.25Zm10.7 8.58 2.7-2.76L5.66 1.58a2.04 2.04 0 0 0-.96-.27l9.6 9.52Zm0 2.34-9.6 9.52c.33 0 .66-.09.96-.27L17 15.93l-2.7-2.76Zm4.08 1.97 2.45-1.4c1.23-.7 1.23-1.84 0-2.54l-2.45-1.4L15.46 12l2.92 3.14Z" />
              </svg>
              <span className="min-w-0 font-[family-name:var(--font-geist-mono)] text-[10px] leading-4 tracking-wider">
                <span className="block text-[9px] text-white/25">{dict.stores.soonOn}</span>
                {dict.stores.googlePlay}
              </span>
            </button>
          </div>

          <div className="mt-3 border-t border-white/10 pt-3">
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </div>
  );
}
