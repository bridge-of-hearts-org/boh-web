import { describe, expect, it, vi } from "vitest";

/* A made-up list with Sinhala names, since the real list only gets Sinhala
   names once they are approved */
vi.mock("@/data/divisionalSecretariats.json", () => ({
    default: [
        { code: "LK0001", district: "Colombo", en: "Alpha", si: "සිංහල නම" },
        { code: "LK0002", district: "Colombo", en: "Beta" },
    ],
}));

import {
    checkDivisionalSecretariat,
    divisionalSecretariatsMatching,
    findDivisionalSecretariat,
    localizedDivisionalSecretariat,
} from "@/utils/divisionalSecretariats";

describe("divisional secretariats with Sinhala names", () => {
    it("finds one by its Sinhala name", () => {
        expect(findDivisionalSecretariat(" සිංහල  නම ")?.en).toBe("Alpha");
    });

    it("stores a name given in Sinhala in English", () => {
        expect(checkDivisionalSecretariat("සිංහල නම", "Colombo")).toEqual({
            name: "Alpha",
        });
    });

    it("shows the Sinhala name on Sinhala pages", () => {
        expect(localizedDivisionalSecretariat("Alpha", "si")).toBe("සිංහල නම");
    });

    it("shows English for one without a Sinhala name", () => {
        expect(localizedDivisionalSecretariat("Beta", "si")).toBe("Beta");
    });

    it("matches a Sinhala search, returning the English name", () => {
        expect(divisionalSecretariatsMatching("සිංහල")).toEqual(["Alpha"]);
    });
});
