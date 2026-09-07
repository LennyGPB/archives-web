"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { localePath } from "@/lib/i18n";

const linkClass = "font-[family-name:var(--font-geist-mono)] text-[10px] tracking-wider text-white/40 no-underline transition-colors duration-300 hover:text-[#86a98d] whitespace-nowrap";

export default function Footer() {
  const { dict, lang } = useI18n();
  const home = localePath(lang, "/");

  return (
    <footer className="relative mt-auto border-t border-white/10 bg-[#08090a] px-6 py-6 md:px-24 lg:px-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#86a98d]/25 to-transparent" aria-hidden="true" />

      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold tracking-widest text-white/70 no-underline" href={home} aria-label={dict.nav.homeAria}>
          <Image alt="" className="h-6 w-auto shrink-0" height={3840} src="/logo_orha.png" width={2160} />
          <span>ORHA<span className="text-[#86a98d]">:</span></span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label={dict.footer.legalHeading}>
          <Link className={linkClass} href={localePath(lang, "/legal-notice")}>{dict.legal.nav.legalNotice}</Link>
          <Link className={linkClass} href={localePath(lang, "/terms-of-service")}>{dict.legal.nav.terms}</Link>
          <Link className={linkClass} href={localePath(lang, "/terms-of-sale")}>{dict.legal.nav.sales}</Link>
          <Link className={linkClass} href={localePath(lang, "/privacy-policy")}>{dict.legal.nav.privacy}</Link>
          <Link className={linkClass} href={localePath(lang, "/cookie-policy")}>{dict.legal.nav.cookies}</Link>
          <Link className={linkClass} href={localePath(lang, "/draw-odds")}>{dict.legal.nav.odds}</Link>
          <a className={linkClass} href="mailto:gleam-pro@proton.me">gleam-pro@proton.me</a>
        </nav>

        <p className="m-0 shrink-0 font-[family-name:var(--font-geist-mono)] text-[10px] tracking-wider text-white/30">
          {dict.footer.copyright.replace("{year}", String(new Date().getFullYear()))}
        </p>
      </div>
    </footer>
  );
}
