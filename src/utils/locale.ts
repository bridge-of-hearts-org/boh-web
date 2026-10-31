import { defaultSortBy } from "./defines";

/* Supported languages. English is the default and has no URL prefix */
export const locales = ["en", "si"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/* Each language's name written in that language, for the language toggle */
export const localeNames: Record<Locale, string> = {
    en: "English",
    si: "සිංහල",
};

/* Sinhala month names, spelled out because runtimes disagree: some format
   Sinhala dates with these names, others with the traditional ones
   (e.g. මැදින් for March), which would differ between server and browser */
export const sinhalaMonths = [
    "ජනවාරි",
    "පෙබරවාරි",
    "මාර්තු",
    "අප්‍රේල්",
    "මැයි",
    "ජූනි",
    "ජූලි",
    "අගෝස්තු",
    "සැප්තැම්බර්",
    "ඔක්තෝබර්",
    "නොවැම්බර්",
    "දෙසැම්බර්",
];

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

/* Whether a path without a locale prefix is an admin page, e.g.
   /admin/login or /facility/edit/abc */
export function isAdminPath(path: string): boolean {
    return adminPathPrefixes.some(
        (adminPrefix) =>
            path === adminPrefix || path.startsWith(`${adminPrefix}/`),
    );
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

        if (isAdminPath(rest)) {
            return rest;
        }
    }

    return null;
}

/* Sorting by name is hard to follow in Sinhala, where few people know the
   full alphabetical order, so Sinhala pages have no sort control */
export function canChooseSort(locale: Locale): boolean {
    return locale !== "si";
}

/* The directory's sort order: the one in the URL where the page offers a
   choice, otherwise the default, so a sort carried over from an English link
   doesn't stick on a page that can't change it */
export function effectiveSortBy(locale: Locale, sortBy?: string): string {
    if (canChooseSort(locale) && sortBy) {
        return sortBy;
    }

    return defaultSortBy;
}
