import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";
import { getDictionary } from "@/lib/dictionaries";
import { defaultLocale, isLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = getDictionary(lang);
  return { title: `${dict.legal.legalNotice.title} — ORHA` };
}

export default async function LegalNoticePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);
  const content = dict.legal.legalNotice;

  return <LegalLayout dict={dict} lang={locale} sections={content.sections} title={content.title} />;
}
