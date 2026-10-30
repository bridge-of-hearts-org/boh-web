import { defineRouting } from "next-intl/routing";

import { defaultLocale, locales } from "@/utils/locale";

/* English pages stay unprefixed (/directory) and other languages get a
   prefix (/si/directory). The URL alone decides the language, so links can
   be shared and each language can be indexed separately. */
export const routing = defineRouting({
    locales,
    defaultLocale,
    localePrefix: "as-needed",
    localeDetection: false,
    localeCookie: false,
    /* The sitemap lists the hreflang alternates instead, so admin and 404
       responses don't advertise Sinhala versions */
    alternateLinks: false,
});
