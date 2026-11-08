import { describe, expect, it } from "vitest";

import { translatedValue } from "@/utils/i18n";

/* A stub translator with Sinhala district names */
const messages: Record<string, string> = { Kandy: "මහනුවර" };
const t = Object.assign((key: string) => messages[key], {
    has: (key: string) => key in messages,
});

describe("translatedValue", () => {
    it("translates a known value", () => {
        expect(translatedValue(t, "Kandy")).toBe("මහනුවර");
    });

    it("keeps a value with no translation", () => {
        expect(translatedValue(t, "Atlantis")).toBe("Atlantis");
    });

    it("keeps an empty value", () => {
        expect(translatedValue(t, "")).toBe("");
    });
});
