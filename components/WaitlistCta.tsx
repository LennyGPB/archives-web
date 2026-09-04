"use client";

import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";

type WaitlistCtaProps = {
  compact?: boolean;
};

export default function WaitlistCta({ compact = false }: WaitlistCtaProps) {
  const { dict } = useI18n();
  const { isAuthenticated, user, openAuthModal } = useAuth();

  if (isAuthenticated && user) {
    return (
      <div className={`flex items-center ${compact ? "min-h-11" : "min-h-14"}`}>
        <span className="flex items-center gap-2 font-[family-name:var(--font-geist-mono)] text-xs tracking-widest text-[#86a98d]">
          <svg aria-hidden="true" className="size-3.5 shrink-0 fill-none stroke-current stroke-[1.5]" viewBox="0 0 20 20"><path className="[stroke-linecap:round] [stroke-linejoin:round]" d="m4 10 4 4 8-8" /></svg>
          {dict.waitlist.confirmedLabel}
        </span>
      </div>
    );
  }

  return (
    <div className={compact ? "min-h-11 w-fit" : "min-h-14 w-full"}>
      <button className={`signal-cta group relative inline-flex cursor-pointer items-center overflow-hidden border border-white/20 bg-black/15 font-semibold transition-[border-color,background-color,color] duration-300 hover:border-[#86a98d]/70 hover:bg-[#86a98d]/5 hover:text-[#e4f0e6] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#86a98d] ${compact ? "min-h-11 w-fit justify-center gap-2 px-3 text-[9px] tracking-wide" : "min-h-14 w-full justify-between gap-3 px-3 text-[10px] tracking-wider sm:gap-5 sm:px-5 sm:text-xs sm:tracking-widest"}`} type="button" onClick={openAuthModal}>
        <span className={`relative z-10 flex items-center ${compact ? "gap-2" : "gap-3"}`}>
          <span className="signal-cta-label whitespace-nowrap" data-text={dict.waitlist.cta}>{dict.waitlist.cta}</span>
          {compact && <svg className="w-3.5 shrink-0 fill-none stroke-[#86a98d] stroke-[1.25] transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 22 22" aria-hidden="true"><path className="[stroke-linecap:round] [stroke-linejoin:round]" d="M4 11h13M13 6l5 5-5 5" /></svg>}
        </span>
        {!compact && (
          <span className="relative z-10 flex items-center gap-3">
            <svg className="w-5 shrink-0 fill-none stroke-[#86a98d] stroke-[1.25] transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 22 22" aria-hidden="true"><path className="[stroke-linecap:round] [stroke-linejoin:round]" d="M4 11h13M13 6l5 5-5 5" /></svg>
          </span>
        )}
      </button>
    </div>
  );
}
