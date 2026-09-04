import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, localeCookie, locales, matchAcceptLanguage, type Locale } from "@/lib/i18n";

const prefixedLocales = locales.filter((locale) => locale !== defaultLocale);

function isUnder(pathname: string, locale: Locale) {
  return pathname === `/${locale}` || pathname.startsWith(`/${locale}/`);
}

/** A manual choice wins over the browser's languages. */
function preferredLocale(request: NextRequest) {
  const remembered = request.cookies.get(localeCookie)?.value;
  if (remembered && isLocale(remembered)) return remembered;
  return matchAcceptLanguage(request.headers.get("accept-language"));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // `/en` is never canonical: the default locale lives at the root.
  if (isUnder(pathname, defaultLocale)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(defaultLocale.length + 1) || "/";
    return NextResponse.redirect(url);
  }

  // `/fr` already maps onto `app/[lang]`, nothing to do.
  if (prefixedLocales.some((locale) => isUnder(pathname, locale))) {
    return NextResponse.next();
  }

  // On the entry point, send visitors to the locale they actually want.
  if (pathname === "/") {
    const preferred = preferredLocale(request);
    if (preferred !== defaultLocale) {
      const url = request.nextUrl.clone();
      url.pathname = `/${preferred}`;
      return NextResponse.redirect(url);
    }
  }

  // Unprefixed paths are the default locale, rendered by `app/[lang]`.
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip the API, Next internals and anything that looks like a static file.
  matcher: ["/((?!api|_next|.*\\.).*)"],
};
