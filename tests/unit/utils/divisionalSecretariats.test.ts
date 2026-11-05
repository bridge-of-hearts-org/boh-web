import { describe, expect, it } from "vitest";

import {
    checkDivisionalSecretariat,
    divisionalSecretariats,
    divisionalSecretariatsIn,
    divisionalSecretariatsMatching,
    findDivisionalSecretariat,
    localizedDivisionalSecretariat,
} from "@/utils/divisionalSecretariats";
import { DistrictsList } from "@/utils/defines";

describe("divisionalSecretariats", () => {
    it("has an English name for each, in a known district", () => {
        expect(divisionalSecretariats.length).toBeGreaterThan(300);
        for (const ds of divisionalSecretariats) {
            expect(DistrictsList).toContain(ds.district);
            expect(ds.en.trim()).not.toBe("");
        }
    });

    it("has every district", () => {
        const districts = new Set(
            divisionalSecretariats.map((ds) => ds.district),
        );

        expect([...districts].sort()).toEqual([...DistrictsList].sort());
    });

    it("has no repeated English names", () => {
        const en = divisionalSecretariats.map((ds) => ds.en.toLowerCase());

        expect(new Set(en).size).toBe(en.length);
    });
});

describe("divisionalSecretariatsIn", () => {
    it("lists only the district's divisional secretariats", () => {
        const colombo = divisionalSecretariatsIn("Colombo");

        expect(colombo.length).toBeGreaterThan(0);
        expect(colombo.every((ds) => ds.district === "Colombo")).toBe(true);
        expect(colombo.map((ds) => ds.en)).toContain("Kolonnawa");
    });

    it("lists all of them without a district", () => {
        expect(divisionalSecretariatsIn("")).toBe(divisionalSecretariats);
    });
});

describe("findDivisionalSecretariat", () => {
    it.each(["Kolonnawa", " kolonnawa "])("finds %j", (name) => {
        expect(findDivisionalSecretariat(name)?.en).toBe("Kolonnawa");
    });

    it("ignores repeated spaces", () => {
        expect(findDivisionalSecretariat("gangawata   korale")?.en).toBe(
            "Gangawata Korale",
        );
    });

    it("looks only in the given district", () => {
        expect(findDivisionalSecretariat("Kolonnawa", "Colombo")).toBeDefined();
        expect(findDivisionalSecretariat("Kolonnawa", "Kandy")).toBeUndefined();
    });
});

describe("checkDivisionalSecretariat", () => {
    it("returns the official English name", () => {
        expect(checkDivisionalSecretariat(" kolonnawa", "Colombo")).toEqual({
            name: "Kolonnawa",
        });
    });

    it.each(["", "   "])("allows an empty value %j", (name) => {
        expect(checkDivisionalSecretariat(name, "Colombo")).toEqual({
            name: "",
        });
    });

    it("rejects a name that isn't in the list", () => {
        expect(
            checkDivisionalSecretariat("Kandy Four Gravets", "Kandy"),
        ).toEqual({
            error: '"Kandy Four Gravets" isn\'t a divisional secretariat in Kandy District. Choose one from the list.',
        });
    });

    it("rejects a name from another district", () => {
        expect(checkDivisionalSecretariat("Kolonnawa", "Kandy")).toHaveProperty(
            "error",
        );
    });

    it("checks the whole list without a district", () => {
        expect(checkDivisionalSecretariat("Kolonnawa", "")).toEqual({
            name: "Kolonnawa",
        });
        expect(checkDivisionalSecretariat("Nowhere", "")).toEqual({
            error: '"Nowhere" isn\'t a divisional secretariat. Choose one from the list.',
        });
    });
});

describe("localizedDivisionalSecretariat", () => {
    it("returns the stored name on English pages", () => {
        expect(localizedDivisionalSecretariat("Kolonnawa", "en")).toBe(
            "Kolonnawa",
        );
    });

    it("shows a name that isn't in the list as stored", () => {
        expect(localizedDivisionalSecretariat("Kandy Four Gravets", "si")).toBe(
            "Kandy Four Gravets",
        );
    });
});

describe("divisionalSecretariatsMatching", () => {
    it("matches English names", () => {
        expect(divisionalSecretariatsMatching("kolonnaw")).toEqual([
            "Kolonnawa",
        ]);
    });

    it("matches nothing for an empty search", () => {
        expect(divisionalSecretariatsMatching(" ")).toEqual([]);
    });
});
