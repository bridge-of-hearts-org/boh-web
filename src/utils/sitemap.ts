import type { MetadataRoute } from "next";

import { locales, localizedPath } from "./locale";

type SitemapEntry = MetadataRoute.Sitemap[number];

/* One sitemap entry per language for the given page, each listing every
   language's URL as an alternate so search engines index them together */
export function localizedSitemapEntries(
    baseUrl: string,
    path: string,
    options: Omit<SitemapEntry, "url" | "alternates">,
): MetadataRoute.Sitemap {
    const languages = Object.fromEntries(
        locales.map((locale) => [
            locale,
            `${baseUrl}${localizedPath(locale, path)}`,
        ]),
    );

    return locales.map((locale) => ({
        url: languages[locale],
        ...options,
        alternates: { languages },
    }));
}
