import { notFound } from "next/navigation";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import { isLocale, type Locale } from "@/lib/i18n";

/**
 * The English dictionary is the reference shape: `fr.json` fails to type-check
 * as soon as a key is missing, renamed or nested differently.
 */
export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, fr };

/**
 * Server-side only — client components read the dictionary from `I18nProvider`
 * so a single locale is shipped to the browser.
 */
export function getDictionary(lang: string): Dictionary {
  if (!isLocale(lang)) notFound();
  return dictionaries[lang];
}
