import Image from "next/image";
import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RichText from "@/components/RichText";
import type { Dictionary } from "@/lib/dictionaries";
import { localePath, type Locale } from "@/lib/i18n";

type LegalSection = {
  heading: string;
  body: string[];
  list?: string[];
  footer?: string[];
};

export default function LegalLayout({
  lang,
  dict,
  title,
  intro,
  sections,
}: {
  lang: Locale;
  dict: Dictionary;
  title: string;
  intro?: string;
  sections: LegalSection[];
}) {
  return (
    <main className="relative isolate min-h-svh bg-[#08090a] px-6 pt-28 pb-24 text-[#f4f3ef] md:px-24 lg:px-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#86a98d]/35 to-transparent" aria-hidden="true" />

      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <Link className="inline-flex shrink-0 items-center gap-2.5 text-base font-semibold tracking-widest text-[#f4f3ef] no-underline" href={localePath(lang, "/")} aria-label={dict.nav.homeAria}>
          <Image alt="" className="h-10 w-auto shrink-0" height={3840} src="/logo_orha.png" width={2160} />
          <span>ORHA<span className="text-[#86a98d]">:</span></span>
        </Link>
        <LanguageSwitcher />
      </header>

      <article className="mx-auto mt-16 max-w-3xl md:mt-20">
        <Link
          className="inline-flex items-center gap-2 font-[family-name:var(--font-geist-mono)] text-[11px] tracking-widest text-white/45 no-underline transition-colors duration-300 hover:text-[#86a98d]"
          href={localePath(lang, "/")}
        >
          <svg aria-hidden="true" className="size-3 fill-none stroke-current stroke-[1.5]" viewBox="0 0 12 12"><path className="[stroke-linecap:round] [stroke-linejoin:round]" d="M8 2 3.5 6l4.5 4" /></svg>
          {dict.legal.common.backHome}
        </Link>

        <h1 className="m-0 mt-6 font-[family-name:var(--font-alumni-sans)] text-5xl leading-[0.95] font-semibold tracking-wide text-[#f4f3ef] sm:text-6xl">{title}</h1>
        <p className="m-0 mt-4 font-[family-name:var(--font-geist-mono)] text-[11px] tracking-widest text-[#86a98d]">{dict.legal.common.updated}</p>

        {intro && <p className="m-0 mt-8 max-w-2xl text-base leading-7 font-thin text-[#aaa9a4]"><RichText>{intro}</RichText></p>}

        <div className="mt-14 flex flex-col gap-12">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="m-0 font-[family-name:var(--font-alumni-sans)] text-2xl leading-none font-semibold tracking-wide text-[#dce9df]">{section.heading}</h2>
              <div className="mt-4 flex flex-col gap-3">
                {section.body.map((paragraph, index) => (
                  <p className="m-0 text-sm leading-6 font-thin text-[#aaa9a4] sm:text-base sm:leading-7" key={index}>
                    <RichText>{paragraph}</RichText>
                  </p>
                ))}
              </div>
              {section.list && (
                <ul className="mt-4 flex flex-col gap-2.5 pl-5">
                  {section.list.map((item, index) => (
                    <li className="list-disc text-sm leading-6 font-thin text-[#aaa9a4] marker:text-[#86a98d] sm:text-base sm:leading-7" key={index}>
                      <RichText>{item}</RichText>
                    </li>
                  ))}
                </ul>
              )}
              {section.footer && (
                <div className="mt-4 flex flex-col gap-3">
                  {section.footer.map((paragraph, index) => (
                    <p className="m-0 text-sm leading-6 font-thin text-[#aaa9a4] sm:text-base sm:leading-7" key={index}>
                      <RichText>{paragraph}</RichText>
                    </p>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
