"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import FloatingWaitlistButton from "@/components/FloatingWaitlistButton";
import GlitchWord from "@/components/GlitchWord";
import { useI18n } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PurchaseSuccessModal from "@/components/PurchaseSuccessModal";
import RichText from "@/components/RichText";
import UserMenu from "@/components/UserMenu";
import WaitlistCta from "@/components/WaitlistCta";

const telemetryClass = "m-0 font-[family-name:var(--font-geist-mono)] text-xs tracking-widest tabular-nums";

const PACK_IDS = ["first", "extended", "deep"] as const;
type PackId = (typeof PACK_IDS)[number];

export default function Home() {
  const { dict, lang } = useI18n();
  const { isAuthenticated, user, openAuthModal, authFetch, refreshUser } = useAuth();
  const [metricsRevealed, setMetricsRevealed] = useState(false);
  const [raritiesRevealed, setRaritiesRevealed] = useState(false);
  const [packsRevealed, setPacksRevealed] = useState(false);
  const [pendingPackId, setPendingPackId] = useState<PackId | null>(null);
  const [purchaseNotice, setPurchaseNotice] = useState<"cancelled" | "error" | null>(null);
  const [purchaseSuccessCredits, setPurchaseSuccessCredits] = useState<number | null>(null);
  const metricsRef = useRef<HTMLDListElement>(null);
  const raritiesRef = useRef<HTMLDivElement>(null);
  const packsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const packs = packsRef.current;
    if (!packs) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPacksRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-15% 0px -15% 0px", threshold: 0 },
    );

    observer.observe(packs);
    return () => observer.disconnect();
  }, []);

  // Stripe redirects back here with `?purchase=success|cancelled` — surface a
  // notice once, then strip the params so a refresh doesn't repeat it. Reading
  // location.search can only happen client-side after mount (it isn't stable
  // across SSR/hydration), so this can't be a lazy initial-state computation.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const purchase = params.get("purchase");
    if (purchase !== "success" && purchase !== "cancelled") return;

    if (purchase === "success") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPurchaseSuccessCredits(Number(params.get("credits")) || 0);
      void refreshUser();
    } else {
      setPurchaseNotice("cancelled");
    }

    params.delete("purchase");
    params.delete("credits");
    const query = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleBuy(packId: PackId) {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    setPurchaseNotice(null);
    setPendingPackId(packId);
    try {
      const response = await authFetch("/api/purchases/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId, locale: lang }),
      });
      const data = response.ok ? ((await response.json()) as { url?: string }) : null;
      if (!data?.url) throw new Error("checkout_failed");
      window.location.href = data.url;
    } catch {
      setPurchaseNotice("error");
      setPendingPackId(null);
    }
  }

  useEffect(() => {
    const rarities = raritiesRef.current;
    if (!rarities) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRaritiesRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-30% 0px -30% 0px", threshold: 0 },
    );

    observer.observe(rarities);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const metrics = metricsRef.current;
    if (!metrics) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMetricsRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-35% 0px -35% 0px", threshold: 0 },
    );

    observer.observe(metrics);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="relative isolate min-h-svh overflow-x-hidden bg-[#08090a] text-[#f4f3ef]">
      <div className="atmosphere pointer-events-none absolute inset-x-0 top-0 -z-10 h-svh overflow-hidden" aria-hidden="true">
        <span className="aurora aurora-a" /><span className="aurora aurora-b" />
        <span className="signal-line signal-line-a" /><span className="signal-line signal-line-b" />
        <span className="vignette absolute inset-0" />
      </div>

      <header className="absolute inset-x-6 top-8 z-20 flex items-center justify-between md:inset-x-16 md:top-12">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <a className="inline-flex shrink-0 items-center gap-2.5 text-base font-semibold tracking-widest text-[#f4f3ef] no-underline" href="#top" aria-label={dict.nav.homeAria}>
            <Image alt="" className="h-14 w-auto shrink-0" height={3840} priority src="/logo_orha.png" width={2160} />
            <span>ORHA<span className="text-[#86a98d]">:</span></span>
          </a>
          {isAuthenticated && <UserMenu />}
        </div>
        <div className="flex items-center gap-2.5">
          <div className="hidden items-center gap-2.5 md:flex">
            <button className="flex h-14 cursor-not-allowed items-center gap-3 border border-white/10 bg-white/[.025] px-5 text-left text-white/35 grayscale" type="button" disabled title={dict.stores.appStoreTitle}>
              <svg className="size-6 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.05 12.54c-.03-3.08 2.52-4.58 2.64-4.65a5.68 5.68 0 0 0-4.48-2.42c-1.88-.2-3.7 1.13-4.66 1.13-.98 0-2.46-1.11-4.05-1.08a5.93 5.93 0 0 0-4.99 3.05c-2.16 3.74-.55 9.23 1.52 12.25 1.04 1.48 2.25 3.13 3.84 3.07 1.56-.06 2.14-.99 4.02-.99 1.86 0 2.41.99 4.03.95 1.67-.02 2.72-1.48 3.72-2.98a12.2 12.2 0 0 0 1.7-3.47 5.34 5.34 0 0 1-3.29-4.86ZM13.98 3.48A5.4 5.4 0 0 0 15.21 0a5.5 5.5 0 0 0-3.56 1.65 5.16 5.16 0 0 0-1.27 3.34 4.55 4.55 0 0 0 3.6-1.51Z" />
              </svg>
              <span className="font-[family-name:var(--font-geist-mono)] text-[10px] leading-4 tracking-wider"><span className="block text-[9px] text-white/25">{dict.stores.soonOn}</span>{dict.stores.appStore}</span>
            </button>
            <button className="flex h-14 cursor-not-allowed items-center gap-3 border border-white/10 bg-white/[.025] px-5 text-left text-white/35 grayscale" type="button" disabled title={dict.stores.googlePlayTitle}>
              <svg className="size-6 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3.6 2.25a1.7 1.7 0 0 0-.35 1.04v17.42c0 .4.13.76.35 1.04l9.55-9.75L3.6 2.25Zm10.7 8.58 2.7-2.76L5.66 1.58a2.04 2.04 0 0 0-.96-.27l9.6 9.52Zm0 2.34-9.6 9.52c.33 0 .66-.09.96-.27L17 15.93l-2.7-2.76Zm4.08 1.97 2.45-1.4c1.23-.7 1.23-1.84 0-2.54l-2.45-1.4L15.46 12l2.92 3.14Z" />
              </svg>
              <span className="font-[family-name:var(--font-geist-mono)] text-[10px] leading-4 tracking-wider"><span className="block text-[9px] text-white/25">{dict.stores.soonOn}</span>{dict.stores.googlePlay}</span>
            </button>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <section className="relative flex min-h-svh items-start px-6 pt-28 pb-28 md:items-center md:px-24 lg:px-36" id="top">
        <div className="z-10 w-full sm:relative md:w-2/3">
          <h1 className="m-0 max-w-3xl text-5xl leading-[0.8] text-[#f4f3ef] sm:text-6xl md:text-7xl xl:text-9xl" aria-label={dict.hero.titleAria}>
            <span className={`hero-title-reveal hero-title-reveal-first block font-[family-name:var(--font-alumni-sans)] font-black ${lang === "en" ? "-ml-[0.06em]" : ""}`}>{dict.hero.titleLine1}</span>
            <span className="hero-title-reveal hero-title-reveal-second -mt-[0.18em] block whitespace-nowrap">
              <span className="font-[family-name:var(--font-alumni-sans)] font-black">{dict.hero.titleLine2}</span>
              {" "}
              <GlitchWord className="-ml-[0.06em] font-[family-name:var(--font-alumni-sans)] font-thin italic tracking-wide">{dict.hero.titleWord}</GlitchWord>
            </span>
          </h1>

          <p className="copy-reveal mt-5 max-w-xl text-base leading-6 font-thin text-[#aaa9a4] sm:mt-10 sm:text-xl sm:leading-7 md:mt-12">{dict.hero.bodyLine1} <br className="hidden sm:block" />{dict.hero.bodyLine2}</p>

          <div className="cta-reveal absolute inset-x-6 bottom-16 z-10 min-h-14 sm:static sm:mt-10 md:mt-14">
            {isAuthenticated && user ? (
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <a aria-label={dict.nav.buyPacksAria} className="group inline-flex h-14 shrink-0 items-center gap-3 border border-[#86a98d]/55 bg-[#86a98d]/12 px-5 font-[family-name:var(--font-geist-mono)] text-xs font-semibold tracking-widest text-[#dce9df] no-underline shadow-[0_10px_28px_rgba(0,0,0,.25)] transition-[border-color,background-color] hover:border-[#b8d2bd] hover:bg-[#86a98d]/22 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#86a98d]" href="#packs">
                  {dict.nav.buyPacks}
                  <svg aria-hidden="true" className="size-3.5 fill-none stroke-current stroke-[1.5] transition-transform group-hover:translate-y-0.5" viewBox="0 0 12 12"><path className="[stroke-linecap:round] [stroke-linejoin:round]" d="M6 2v7M3.5 6.5 6 9l2.5-2.5" /></svg>
                </a>
                <p className="m-0 flex max-w-lg flex-col gap-2.5 text-sm leading-5 text-[#aaa9a4]" role="status">
                  <span className="font-[family-name:var(--font-geist-mono)] text-xs tracking-widest text-[#86a98d]">{dict.waitlist.confirmedLabel}</span>
                  {dict.auth.connectedAs.replace("{pseudo}", user.pseudo)}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-stretch sm:flex-row sm:items-center">
              <div className="relative mb-7 sm:mb-0">
                <button className="signal-cta group relative inline-flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 overflow-hidden border border-white/20 bg-black/15 px-4 text-[10px] font-semibold tracking-wider transition-[border-color,background-color,color] duration-300 hover:border-[#86a98d]/70 hover:bg-[#86a98d]/5 hover:text-[#e4f0e6] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#86a98d] sm:w-auto sm:min-w-96 sm:gap-5 sm:px-5 sm:text-xs sm:tracking-widest" type="button" onClick={openAuthModal}>
                  <span className="relative z-10 flex items-center gap-3">
                    <span className="signal-cta-label whitespace-nowrap" data-text={dict.waitlist.cta}>{dict.waitlist.cta}</span>
                  </span>
                  <span className="relative z-10 flex items-center gap-3">
                    <span className="hidden font-[family-name:var(--font-geist-mono)] text-xs font-normal tracking-wider text-[#86a98d]/55 sm:block">{dict.hero.chapter}</span>
                    <svg className="w-5 fill-none stroke-[#86a98d] stroke-[1.25] transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 22 22" aria-hidden="true"><path className="[stroke-linecap:round] [stroke-linejoin:round]" d="M4 11h13M13 6l5 5-5 5" /></svg>
                  </span>
                </button>
                <p className="absolute inset-x-0 top-full mt-2 text-center font-[family-name:var(--font-geist-mono)] text-[10px] tracking-wider text-white/40 tabular-nums">
                  {dict.waitlist.teaser}
                </p>
              </div>
              <span className="relative mx-auto hidden h-6 w-px shrink-0 overflow-hidden bg-gradient-to-b from-white/20 via-[#86a98d]/70 to-white/20 sm:mx-0 sm:block sm:h-px sm:w-8 sm:bg-gradient-to-r" aria-hidden="true">
                <span className="connection-wire-pulse absolute size-1 rounded-full bg-[#dce9df] shadow-[0_0_8px_rgba(134,169,141,0.95)]" />
              </span>
              <a aria-label={dict.nav.buyPacksAria} className="group hidden min-h-14 w-full items-center justify-between gap-5 border border-white/10 bg-transparent px-5 text-xs font-medium tracking-widest text-white/60 no-underline transition-[border-color,color,background-color] duration-300 hover:border-white/30 hover:bg-white/5 hover:text-[#f4f3ef] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#86a98d] sm:inline-flex sm:w-auto" href="#packs">
                {dict.nav.buyPacks}
                <svg className="w-4 fill-none stroke-current stroke-[1.25] transition-transform duration-300 group-hover:translate-y-0.5" viewBox="0 0 12 12" aria-hidden="true"><path className="[stroke-linecap:round] [stroke-linejoin:round]" d="M6 2v7M3.5 6.5 6 9l2.5-2.5" /></svg>
              </a>
              </div>
            )}
          </div>
        </div>
        <footer className="absolute right-0 bottom-0 left-0 z-20 overflow-hidden border-t border-white/10 bg-black/10 py-3 backdrop-blur-[2px]" aria-label={dict.hero.seasonMarquee}>
        <div className="season-marquee-track flex w-max">
          {[0, 1].map((group) => (
            <div className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={group === 1} key={group}>
              {Array.from({ length: 8 }).map((_, index) => (
                <span className={`${telemetryClass} flex items-center gap-8 whitespace-nowrap text-[rgba(134,169,141,0.78)]`} key={index}>
                  {dict.hero.seasonMarquee}
                  <span className="size-1 bg-[#86a98d]/60 shadow-[0_0_6px_rgba(134,169,141,0.7)]" aria-hidden="true" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </footer>
      </section>

      <section className="relative bg-[#08090a] px-6 py-24 md:px-24 md:py-32 lg:px-36 lg:py-40" id="about">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#86a98d]/35 to-transparent" aria-hidden="true" />
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-12 md:items-stretch">
            <h2 className="m-0 font-[family-name:var(--font-alumni-sans)] text-5xl leading-none font-semibold tracking-wide text-[#f4f3ef] sm:text-6xl md:col-span-7 md:text-7xl lg:text-8xl">
              {dict.about.headingLine1}<br />{dict.about.headingLine2Prefix}{" "}
              <GlitchWord className="font-thin italic tracking-wide">{dict.about.headingWord}</GlitchWord><br />{dict.about.headingLine3}
            </h2>
            <div className="flex flex-col md:col-span-5">
              <div className="grid grid-cols-2 gap-2.5 md:mt-3" aria-label={dict.stores.groupAria}>
                <button className="flex min-h-14 cursor-not-allowed items-center gap-3 border border-white/10 bg-white/[.025] px-3 text-left text-white/35 grayscale sm:px-5" type="button" disabled title={dict.stores.appStoreTitle}>
                  <svg className="size-6 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.05 12.54c-.03-3.08 2.52-4.58 2.64-4.65a5.68 5.68 0 0 0-4.48-2.42c-1.88-.2-3.7 1.13-4.66 1.13-.98 0-2.46-1.11-4.05-1.08a5.93 5.93 0 0 0-4.99 3.05c-2.16 3.74-.55 9.23 1.52 12.25 1.04 1.48 2.25 3.13 3.84 3.07 1.56-.06 2.14-.99 4.02-.99 1.86 0 2.41.99 4.03.95 1.67-.02 2.72-1.48 3.72-2.98a12.2 12.2 0 0 0 1.7-3.47 5.34 5.34 0 0 1-3.29-4.86ZM13.98 3.48A5.4 5.4 0 0 0 15.21 0a5.5 5.5 0 0 0-3.56 1.65 5.16 5.16 0 0 0-1.27 3.34 4.55 4.55 0 0 0 3.6-1.51Z" />
                  </svg>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[9px] leading-4 tracking-wider sm:text-[10px]"><span className="block text-[8px] text-white/25 sm:text-[9px]">{dict.stores.soonOn}</span>{dict.stores.appStore}</span>
                </button>
                <button className="flex min-h-14 cursor-not-allowed items-center gap-3 border border-white/10 bg-white/[.025] px-3 text-left text-white/35 grayscale sm:px-5" type="button" disabled title={dict.stores.googlePlayTitle}>
                  <svg className="size-6 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3.6 2.25a1.7 1.7 0 0 0-.35 1.04v17.42c0 .4.13.76.35 1.04l9.55-9.75L3.6 2.25Zm10.7 8.58 2.7-2.76L5.66 1.58a2.04 2.04 0 0 0-.96-.27l9.6 9.52Zm0 2.34-9.6 9.52c.33 0 .66-.09.96-.27L17 15.93l-2.7-2.76Zm4.08 1.97 2.45-1.4c1.23-.7 1.23-1.84 0-2.54l-2.45-1.4L15.46 12l2.92 3.14Z" />
                  </svg>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[9px] leading-4 tracking-wider sm:text-[10px]"><span className="block text-[8px] text-white/25 sm:text-[9px]">{dict.stores.soonOn}</span>{dict.stores.googlePlay}</span>
                </button>
              </div>
              <p className="m-0 mt-8 max-w-xl text-base leading-7 font-thin text-[#aaa9a4] md:mt-auto md:pt-8 md:text-lg">
                <RichText>{dict.about.body}</RichText>
              </p>
            </div>
          </div>

          {/* <dl className="relative mt-20 grid md:mt-28 md:grid-cols-3" ref={metricsRef}>
            <span className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-px origin-left bg-white/20 transition-transform duration-[1400ms] ease-[cubic-bezier(.16,1,.3,1)] ${metricsRevealed ? "scale-x-100" : "scale-x-0"}`} aria-hidden="true" />
            <span className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px origin-right bg-white/20 transition-transform delay-300 duration-[1400ms] ease-[cubic-bezier(.16,1,.3,1)] ${metricsRevealed ? "scale-x-100" : "scale-x-0"}`} aria-hidden="true" />
            {[
              ["01", dict.metrics.perDay],
              ["30", dict.metrics.perSeason],
              ["04", dict.metrics.tiers],
            ].map(([value, label], index) => (
              <div className="group relative py-10 md:px-10 md:py-14" key={value}>
                {index > 0 && (
                  <span
                    className={`pointer-events-none absolute top-0 left-0 h-px w-full origin-left bg-white/20 transition-transform duration-1000 ease-[cubic-bezier(.16,1,.3,1)] md:h-full md:w-px md:origin-top ${metricsRevealed ? "scale-x-100 md:scale-y-100" : "scale-x-0 md:scale-x-100 md:scale-y-0"}`}
                    style={{ transitionDelay: `${300 + index * 180}ms` }}
                    aria-hidden="true"
                  />
                )}
                <dt className="order-2 mt-5 font-[family-name:var(--font-geist-mono)] text-xs tracking-widest text-white/50">{label}</dt>
                <dd className="m-0 font-[family-name:var(--font-alumni-sans)] text-8xl leading-none font-thin tabular-nums text-[#86a98d] transition-colors duration-500 group-hover:text-[#dce9df] md:text-9xl">{value}</dd>
                <span className="absolute right-0 bottom-0 left-0 h-px origin-left scale-x-0 bg-[#86a98d] transition-transform duration-500 group-hover:scale-x-100" aria-hidden="true" />
              </div>
            ))}
          </dl> */}
        </div>
      </section>

      <section
        className="relative z-0 overflow-hidden bg-[#08090a] bg-[url('/backeden.png')] bg-cover bg-center bg-fixed max-[768px]:bg-scroll"
        id="eden"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-[#86a98d]/35 to-transparent" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(8,9,10,.85),rgba(8,9,10,.5)_42%,rgba(8,9,10,.28)_68%,rgba(8,9,10,.58))]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-[#08090a] via-transparent to-[#08090a]" aria-hidden="true" />
        <div className="relative z-[3] mx-auto flex min-h-[70svh] max-w-7xl flex-col items-center justify-center px-6 py-18 text-center md:px-24 md:py-22 lg:px-36">
          <h2 className="title-traces relative inline-block w-fit font-[family-name:var(--font-alumni-sans)] text-7xl leading-none font-bold tracking-wide text-[#f4f3ef] italic sm:text-8xl md:text-9xl xl:text-[11rem]">
            <span className="title-traces-main relative z-[1] block">EDEN</span>
            <span className="glitch-ghost glitch-ghost-eden pointer-events-none absolute inset-0 z-[2] block text-[#86a98d]" aria-hidden="true">EDEN</span>
            <span className="glitch-ghost glitch-ghost-white pointer-events-none absolute inset-0 z-[2] block text-[#f4f3ef]" aria-hidden="true">EDEN</span>
            <span className="glitch-scanline pointer-events-none absolute top-[58%] right-0 left-0 z-[3] h-0.5 bg-[#86a98d]" aria-hidden="true" />
          </h2>
          <span className={`${telemetryClass} mt-5 flex items-center gap-4 text-[#b8d2bd]`}>
            <span className="h-px w-8 bg-[#86a98d]/50" aria-hidden="true" />
            {dict.eden.season}
            <span className="h-px w-8 bg-[#86a98d]/50" aria-hidden="true" />
          </span>
          <div className="relative mt-8 w-full max-w-2xl border-y border-[#86a98d]/25 bg-black/20 px-6 py-8 backdrop-blur-md sm:px-10 md:mt-10 md:px-12 md:py-10">
            <span className="pointer-events-none absolute -top-px -left-px size-3 border-t border-l border-[#86a98d]" aria-hidden="true" />
            <span className="pointer-events-none absolute -right-px -bottom-px size-3 border-r border-b border-[#86a98d]" aria-hidden="true" />
            <p className="m-0 text-balance font-[family-name:var(--font-alumni-sans)] text-4xl leading-none font-medium tracking-wide text-[#dce9df] sm:text-5xl md:text-6xl">{dict.eden.tagline}</p>
            <p className="m-0 mt-4 text-balance text-sm leading-7 font-light text-[#dce9df]/80 md:mt-5 md:text-base">
              <RichText className="font-semibold text-[#f4f3ef]">{dict.eden.body}</RichText>
            </p>
          </div>
        </div>
      </section>

      <section className="relative bg-[#08090a] px-6 py-24 md:px-24 md:py-32 lg:px-36 lg:py-40" id="raretes">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#86a98d]/35 to-transparent" aria-hidden="true" />
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-12 md:items-end">
            <h2 className="m-0 font-[family-name:var(--font-alumni-sans)] text-5xl leading-none font-semibold tracking-wide text-[#f4f3ef] sm:text-6xl md:col-span-7 md:text-7xl lg:text-8xl">
              {dict.rarities.headingPrefix && <>{dict.rarities.headingPrefix}{" "}</>}
              <GlitchWord className="font-thin italic tracking-wide">{dict.rarities.headingWord}</GlitchWord>{" "}
              {dict.rarities.headingSuffix}
            </h2>
            <p className="m-0 max-w-xl text-base leading-7 font-thin text-[#aaa9a4] md:col-span-5 md:pb-2 md:text-lg">
              <RichText>{dict.rarities.bodyLine1}</RichText><br />
              <RichText>{dict.rarities.bodyLine2}</RichText>
            </p>
          </div>

          <div className="mt-20 grid gap-x-6 gap-y-16 sm:grid-cols-2 md:mt-28 lg:grid-cols-4" ref={raritiesRef}>
            {[
              { ...dict.rarities.common, img: "growknit_flou.png", accent: "text-white/50", tilt: -3 },
              { ...dict.rarities.prime, img: "secondskin_flou.png", accent: "text-[#86a98d]", tilt: 2 },
              { ...dict.rarities.anomaly, img: "endless_flou.png", accent: "text-[#b9d6bf]", tilt: -2 },
              { ...dict.rarities.singularity, img: "eve_flou.png", accent: "text-[#f4f3ef]", tilt: 3 },
            ].map((r, index) => (
              <div
                className={`group flex flex-col items-center text-center transition-[opacity,filter,clip-path] duration-1000 ease-[cubic-bezier(.16,1,.3,1)] ${raritiesRevealed ? "opacity-100 blur-none [clip-path:inset(0_0_0_0)]" : "opacity-0 blur-sm [clip-path:inset(0_0_100%_0)]"}`}
                key={r.img}
                style={{ transform: `rotate(${r.tilt}deg)`, transitionDelay: `${index * 140}ms` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={r.tier} className="w-full max-w-[220px] shadow-[0_20px_45px_rgba(0,0,0,.5)]" src={`/archives/${r.img}`} />
                <span className={`${telemetryClass} mt-6 ${r.accent}`}>{r.tier}</span>
                <p className="m-0 mt-2 font-[family-name:var(--font-alumni-sans)] text-2xl leading-none font-semibold tracking-wide text-[#f4f3ef]">{r.keyword}</p>
                <p className="m-0 mt-2 text-sm leading-6 font-thin text-[#aaa9a4]">{r.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-[#08090a] px-6 py-14 md:px-24 md:py-14 lg:px-36 lg:py-14" id="collection">
        {/* <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#86a98d]/35 to-transparent" aria-hidden="true" /> */}
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-12 md:items-end">
            <h2 className="m-0 font-[family-name:var(--font-alumni-sans)] text-5xl leading-none font-semibold tracking-wide text-[#f4f3ef] sm:text-6xl md:col-span-7 md:text-7xl lg:text-8xl">
              {dict.collection.headingLine1}<br />
              <GlitchWord className="font-thin italic tracking-wide">{dict.collection.headingWord}</GlitchWord>
            </h2>
            <p className="m-0 max-w-xl text-base leading-7 font-thin text-[#aaa9a4] md:col-span-5 md:pb-2 md:text-lg">
              <RichText>{dict.collection.bodyLine1}</RichText><br />
              <RichText>{dict.collection.bodyLine2}</RichText>
            </p>
          </div>

          <div className="mt-20 md:mt-28">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <span className={`${telemetryClass} text-white/50`}>{dict.collection.registry}</span>
              <span className={`${telemetryClass} text-[#86a98d]`}>{dict.collection.discoveries}</span>
            </div>
          </div>
        </div>

        <div className="relative left-1/2 mt-8 w-screen -translate-x-1/2 overflow-hidden">
          <div className="season-marquee-track collection-marquee-track flex w-max">
            {[0, 1].map((group) => (
              <div className="flex shrink-0 items-center gap-4 pr-4 md:gap-6 md:pr-6" aria-hidden={group === 1} key={group}>
                {Array.from({ length: 30 }).map((_, index) => (
                  <div className="group relative aspect-[5/8] w-28 shrink-0 overflow-hidden border border-white/10 bg-black/30 transition-colors duration-500 hover:border-white/25 sm:w-32 md:w-36" key={index}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <svg aria-hidden="true" className="w-5 fill-none stroke-white/25 stroke-[1.25] transition-colors duration-500 group-hover:stroke-white/40" viewBox="0 0 24 24">
                        <rect className="[stroke-linejoin:round]" height="9" rx="1.5" width="14" x="5" y="11" />
                        <path className="[stroke-linecap:round]" d="M8 11V8a4 4 0 0 1 8 0v3" />
                      </svg>
                      <span className="font-[family-name:var(--font-geist-mono)] text-[10px] tracking-widest text-white/25">Nº{String(index + 1).padStart(2, "0")}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0a0d0b] px-6 py-24 md:px-24 md:py-32 lg:px-36 lg:py-40" id="packs">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(134,169,141,.1),transparent_42%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#86a98d]/45 to-transparent" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-12 md:items-end">
            <h2 className="m-0 font-[family-name:var(--font-alumni-sans)] text-5xl leading-none font-semibold tracking-wide text-[#f4f3ef] sm:text-6xl md:col-span-7 md:text-7xl lg:text-8xl">
              {dict.packs.headingPrefix}<br />
              <GlitchWord className="font-thin italic tracking-wide">{dict.packs.headingWord}</GlitchWord>
            </h2>
            <p className="m-0 max-w-xl text-base leading-7 font-thin text-[#aaa9a4] md:col-span-5 md:pb-2 md:text-lg">
              <RichText>{dict.packs.body}</RichText>
            </p>
          </div>

          {purchaseNotice && (
            <p className="m-0 mt-10 border border-white/20 bg-white/5 px-4 py-3 font-[family-name:var(--font-geist-mono)] text-[11px] tracking-wide text-white/60">
              {purchaseNotice === "cancelled" ? dict.packs.purchaseCancelled : dict.packs.purchaseError}
            </p>
          )}

          <div className="mt-16 grid gap-6 md:mt-24 xl:grid-cols-3 xl:items-stretch xl:gap-6" ref={packsRef}>
            {[dict.packs.first, dict.packs.extended, dict.packs.deep].map((pack, index) => {
              const packId = PACK_IDS[index];
              const featured = index === 1;
              const unitPrice = pack.priceValue / pack.unitsValue;
              const baseUnitPrice = dict.packs.first.priceValue / dict.packs.first.unitsValue;
              const savingsPercent = index > 0 ? Math.round((1 - unitPrice / baseUnitPrice) * 100) : 0;
              const unitPriceLabel = new Intl.NumberFormat(lang, { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(unitPrice);

              return (
                <article
                  className={`group relative flex min-w-0 flex-col border px-6 pb-7 pt-8 transition-[opacity,filter,transform,border-color,background-color] sm:px-8 sm:pb-8 xl:min-h-[470px] motion-reduce:transition-none ${
                    featured
                      ? "border-[#86a98d] bg-[#86a98d]/12 xl:-my-4 xl:pt-12 xl:pb-12"
                      : "border-white/15 bg-[#08090a] hover:border-[#86a98d]/60 hover:bg-[#86a98d]/5"
                  } motion-safe:hover:-translate-y-1 ${
                    packsRevealed ? "opacity-100 blur-none" : "opacity-0 blur-sm"
                  }`}
                  key={pack.name}
                  style={{
                    transitionDuration: "1000ms, 1000ms, 300ms, 300ms, 300ms",
                    transitionTimingFunction: "cubic-bezier(.16,1,.3,1), cubic-bezier(.16,1,.3,1), ease, ease, ease",
                    transitionDelay: `${index * 160}ms, ${index * 160}ms, 0ms, 0ms, 0ms`,
                  }}
                >
                  <span className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${featured ? "via-[#b8d2bd]" : "via-white/25"}`} aria-hidden="true" />

                  {featured && (
                    <span className="absolute -top-3.5 left-6 flex min-h-7 items-center justify-center gap-2 bg-[#86a98d] px-3 py-1 font-[family-name:var(--font-geist-mono)] text-[10px] font-semibold tracking-wider text-[#08090a] sm:left-8">
                      <svg aria-hidden="true" className="size-2.5 fill-current" viewBox="0 0 12 12"><path d="M6 0l1.545 3.755L11.5 4.5 8.6 7.09 9.27 11 6 9.1 2.73 11l.67-3.91L.5 4.5l3.955-.745L6 0z" /></svg>
                      {dict.packs.mostChosen}
                    </span>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <h3 className="m-0 font-[family-name:var(--font-alumni-sans)] text-3xl leading-none font-semibold tracking-wide text-[#dce9df]">{pack.name}</h3>
                    <div className="flex items-end gap-1" aria-hidden="true">
                      {[0, 1, 2].map((bar) => (
                        <span className={`w-1.5 ${bar === 0 ? "h-2" : bar === 1 ? "h-3.5" : "h-5"} ${bar <= index ? "bg-[#86a98d]" : "bg-white/10"}`} key={bar} />
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 flex items-end justify-between gap-4 border-b border-[#86a98d]/20 pb-7">
                    <div>
                      <span className={`block font-[family-name:var(--font-alumni-sans)] text-8xl leading-[.85] font-semibold tabular-nums ${featured ? "text-[#f4f3ef]" : "text-[#dce9df]"}`}>{pack.count}</span>
                      <span className="mt-3 block font-[family-name:var(--font-geist-mono)] text-[11px] tracking-wider text-[#b8d2bd]">{dict.packs.transmissions.toUpperCase()}</span>
                    </div>
                    {savingsPercent > 0 && <span className="mb-0.5 max-w-28 text-right font-[family-name:var(--font-geist-mono)] text-xs leading-5 font-semibold text-[#b8d2bd]">{dict.packs.save.replace("{percent}", String(savingsPercent))}</span>}
                  </div>

                  <div className="mt-6">
                    <span className="block font-[family-name:var(--font-alumni-sans)] text-5xl leading-none font-semibold tabular-nums text-[#f4f3ef]">{pack.price}</span>
                    <p className="m-0 mt-2 font-[family-name:var(--font-geist-mono)] text-[10px] leading-5 tracking-wider text-[#aaa9a4]">{unitPriceLabel} {dict.packs.perTransmission}</p>
                  </div>

                  <p className="m-0 mt-5 mb-8 max-w-xs text-sm leading-6 text-[#dce9df]">{pack.detail}</p>

                  <button
                    className={`group/buy relative mt-auto flex min-h-14 cursor-pointer items-center justify-between gap-2.5 px-5 font-[family-name:var(--font-geist-mono)] text-xs font-semibold tracking-wider transition-[background-color,border-color] duration-200 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#86a98d] disabled:pointer-events-none disabled:opacity-60 ${
                      featured
                        ? "border border-[#86a98d] bg-[#86a98d] text-[#08090a] hover:bg-[#b8d2bd] hover:border-[#b8d2bd]"
                        : "border border-[#86a98d]/60 bg-[#86a98d]/10 text-[#dce9df] hover:border-[#86a98d] hover:bg-[#86a98d]/20"
                    }`}
                    disabled={pendingPackId === packId}
                    aria-label={`${dict.packs.buy} ${pack.name} — ${pack.price}`}
                    aria-busy={pendingPackId === packId}
                    onClick={() => void handleBuy(packId)}
                    type="button"
                  >
                    <span>
                      {pendingPackId === packId ? dict.packs.processing : dict.packs.buy}
                    </span>
                    <svg aria-hidden="true" className="relative z-10 size-3.5 shrink-0 fill-none stroke-current stroke-[1.5] transition-transform duration-300 group-hover/buy:translate-x-1" viewBox="0 0 22 22">
                      <path className="[stroke-linecap:round] [stroke-linejoin:round]" d="M4 11h13M13 6l5 5-5 5" />
                    </svg>
                  </button>
                </article>
              );
            })}
          </div>

          <div className="mt-8 grid gap-5 border-b border-white/10 pb-8 md:grid-cols-12 md:items-center">
            <p className="m-0 max-w-3xl text-xs leading-6 text-white/45 md:col-span-8">{dict.packs.disclaimer}</p>
            <p className="m-0 font-[family-name:var(--font-geist-mono)] text-[10px] leading-5 tracking-widest text-[#86a98d] md:col-span-4 md:text-right">{dict.packs.deadline}</p>
          </div>
        </div>
      </section>

      <section className="relative isolate flex min-h-[78svh] flex-col overflow-hidden bg-[#08090a] pr-8 pl-6 pt-16 pb-6 md:flex-row md:px-24 md:py-28 lg:px-36" id="waitlist">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_76%_48%,rgba(134,169,141,.14),transparent_30%),linear-gradient(180deg,#08090a_0%,#0b100d_58%,#08090a_100%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#86a98d]/50 to-transparent" aria-hidden="true" />

        <div className="mx-auto grid min-w-0 w-full max-w-7xl flex-1 content-center gap-10 sm:gap-12 lg:grid-cols-12 lg:items-center lg:gap-10">
          <div className="lg:col-span-7">
            <h2 className="m-0 max-w-3xl font-[family-name:var(--font-alumni-sans)] text-5xl leading-[.9] font-semibold tracking-wide text-[#f4f3ef] sm:text-7xl sm:leading-[.86] md:text-8xl lg:text-9xl">
              {dict.finalCta.headingLine1}<br />{dict.finalCta.headingLine2}{" "}
              <GlitchWord className="font-thin italic">{dict.finalCta.headingWord}</GlitchWord>
            </h2>
            <p className="m-0 mt-6 max-w-lg text-base leading-7 font-thin text-[#aaa9a4] sm:mt-8">
              {dict.finalCta.body}
            </p>
          </div>

          <div className="relative lg:col-span-5 lg:pl-10">
            <span className="absolute -top-px -left-px size-3 border-t border-l border-[#86a98d] lg:left-[2.5rem]" aria-hidden="true" />
            <span className="absolute -right-px -bottom-px size-3 border-r border-b border-[#86a98d]" aria-hidden="true" />
            <div className="border-y border-white/15 bg-black/20 px-4 py-6 shadow-[0_24px_70px_rgba(0,0,0,.38)] sm:px-8 sm:py-10">
              <div className="mb-6 flex items-center justify-between gap-3 border-b border-white/10 pb-4 sm:mb-8 sm:gap-6">
                <span className={`${telemetryClass} text-[10px] text-[#86a98d] sm:text-xs`}>{dict.finalCta.earlyAccess}</span>
                <span className="flex items-center gap-2 font-[family-name:var(--font-geist-mono)] text-[10px] tracking-widest text-white/45">
                  <span className="status-pulse size-1 rounded-full bg-[#86a98d]" aria-hidden="true" />{dict.finalCta.status}
                </span>
              </div>
              <WaitlistCta />
              <p className="m-0 mt-5 text-center font-[family-name:var(--font-geist-mono)] text-[10px] leading-5 tracking-widest text-white/35">{dict.finalCta.season}</p>
            </div>
          </div>
        </div>

        <div className="relative mt-12 flex w-full items-end justify-end border-t border-white/10 pt-4 md:absolute md:inset-x-24 md:bottom-6 md:mt-0 md:w-auto md:justify-between lg:inset-x-36" aria-hidden="true">
          <span className={`${telemetryClass} hidden text-white/30 sm:inline`}>{dict.finalCta.signature}</span>
          <span className="font-[family-name:var(--font-alumni-sans)] text-2xl font-semibold tracking-widest text-white/50">ORHA<span className="text-[#86a98d]">:</span></span>
        </div>
      </section>

      <FloatingWaitlistButton />
      <PurchaseSuccessModal credits={purchaseSuccessCredits} onClose={() => setPurchaseSuccessCredits(null)} />
    </main>
  );
}
