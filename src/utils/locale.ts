/* Supported languages. English is the default and has no URL prefix */
export const locales = ["en", "si"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/* Each language's name written in that language, for the language toggle */
export const localeNames: Record<Locale, string> = {
    en: "English",
    si: "සිංහල",
};

/* Admin pages are English-only. These path prefixes are matched after the
   locale prefix is removed. */
const adminPathPrefixes = ["/admin", "/facility/new", "/facility/edit"];

/* The path of the given page in the given language, e.g. ("si", "/about")
   gives "/si/about" and ("en", "/about") gives "/about". The path may carry
   a query string. */
export function localizedPath(locale: Locale, path: string): string {
    if (locale === defaultLocale) {
        return path;
    }

    /* The homepage is /si, not /si/ */
    if (path === "/" || path.startsWith("/?")) {
        return `/${locale}${path.slice(1)}`;
    }

    return `/${locale}${path}`;
}

/* The language to switch to from the given one */
export function otherLocale(locale: Locale): Locale {
    return locale === "en" ? "si" : "en";
}

/* For a non-English admin path such as /si/admin/login, the English path to
   redirect to (/admin/login). Null for any other path. */
export function adminRedirectPath(pathname: string): string | null {
    for (const locale of locales) {
        if (locale === defaultLocale) {
            continue;
        }

        const prefix = `/${locale}`;

        if (!pathname.startsWith(`${prefix}/`)) {
            continue;
        }

        const rest = pathname.slice(prefix.length);
        const isAdminPath = adminPathPrefixes.some(
            (adminPrefix) =>
                rest === adminPrefix || rest.startsWith(`${adminPrefix}/`),
        );

        if (isAdminPath) {
            return rest;
        }
    }

    return null;
}
