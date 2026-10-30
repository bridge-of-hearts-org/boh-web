import { describe, expect, it } from "vitest";

import { localizedSitemapEntries } from "@/utils/sitemap";

const baseUrl = "https://bridgeofhearts.lk";

describe("localizedSitemapEntries", () => {
    it("lists every language with the same alternates and an English x-default", () => {
        const lastModified = new Date("2026-01-01");
        const entries = localizedSitemapEntries(baseUrl, "/directory", {
            lastModified,
            priority: 0.9,
        });
        const languages = {
            en: `${baseUrl}/directory`,
            si: `${baseUrl}/si/directory`,
            "x-default": `${baseUrl}/directory`,
        };

        expect(entries).toEqual([
            {
                url: languages.en,
                lastModified,
                priority: 0.9,
                alternates: { languages },
            },
            {
                url: languages.si,
                lastModified,
                priority: 0.9,
                alternates: { languages },
            },
        ]);
    });

    it("uses /si for the Sinhala homepage", () => {
        const entries = localizedSitemapEntries(baseUrl, "/", {});

        expect(entries.map((e) => e.url)).toEqual([
            `${baseUrl}/`,
            `${baseUrl}/si`,
        ]);
    });
});
