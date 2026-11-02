import { describe, expect, it } from "vitest";

import {
    localizeFacility,
    normalizeTranslations,
    parseLocale,
    parseSheetTranslations,
    translatedField,
    translationColumn,
} from "@/utils/facilityTranslations";
import { emptyChildCareFacilityDbObject } from "@/utils/defines";

const facility = {
    ...emptyChildCareFacilityDbObject,
    name: "Home",
    description: "About",
    managedBy: "Sisters",
    location: {
        ...emptyChildCareFacilityDbObject.location,
        address: "1 Main St",
        city: "Kandy",
        district: "Kandy",
    },
};

const emptyEntry = {
    name: null,
    description: null,
    address: null,
    city: null,
    managedBy: null,
};

describe("parseLocale", () => {
    it.each([
        ["si", "si"],
        ["en", "en"],
        ["ta", "en"],
        [undefined, "en"],
        [123, "en"],
    ])("reads %j as %s", (value, expected) => {
        expect(parseLocale(value)).toBe(expected);
    });
});

describe("translatedField", () => {
    const translations = { si: { ...emptyEntry, name: " සිංහල නම " } };

    it("returns the trimmed translation", () => {
        expect(translatedField(translations, "si", "name", "Home")).toBe(
            "සිංහල නම",
        );
    });

    it("returns English on English pages", () => {
        expect(translatedField(translations, "en", "name", "Home")).toBe(
            "Home",
        );
    });

    it.each([
        ["no translations", null],
        ["no Sinhala entry", { si: null }],
        ["no value for the field", { si: emptyEntry }],
        ["a blank value", { si: { ...emptyEntry, name: "  " } }],
    ])("falls back to English with %s", (_, value) => {
        expect(translatedField(value, "si", "name", "Home")).toBe("Home");
    });
});

describe("localizeFacility", () => {
    const translated = {
        ...facility,
        translations: {
            si: { ...emptyEntry, name: "සිංහල නම", city: "මහනුවර" },
        },
    };

    it("replaces each translated field and keeps English for the rest", () => {
        const result = localizeFacility(translated, "si");

        expect(result).toEqual({
            ...translated,
            name: "සිංහල නම",
            location: { ...translated.location, city: "මහනුවර" },
        });
    });

    it("doesn't change the stored facility", () => {
        localizeFacility(translated, "si");

        expect(translated.name).toBe("Home");
        expect(translated.location.city).toBe("Kandy");
    });

    it("returns the facility as is on English pages", () => {
        expect(localizeFacility(translated, "en")).toBe(translated);
    });

    it("returns English values for a facility without translations", () => {
        expect(localizeFacility(facility, "si")).toEqual(facility);
    });
});

describe("parseSheetTranslations", () => {
    it("names the sheet columns after the English ones", () => {
        expect(translationColumn("si", "name")).toBe("Name (Sinhala)");
        expect(translationColumn("si", "managedBy")).toBe(
            "Managed By (Sinhala)",
        );
    });

    it("reads every Sinhala column", () => {
        expect(
            parseSheetTranslations({
                Name: "Home",
                "Name (Sinhala)": " සිංහල නම ",
                "Description (Sinhala)": "විස්තරය",
                "Address (Sinhala)": "ලිපිනය",
                "City (Sinhala)": "මහනුවර",
                "Managed By (Sinhala)": "සහෝදරියන්",
            }),
        ).toEqual({
            si: {
                name: "සිංහල නම",
                description: "විස්තරය",
                address: "ලිපිනය",
                city: "මහනුවර",
                managedBy: "සහෝදරියන්",
            },
        });
    });

    it("leaves empty cells out", () => {
        expect(
            parseSheetTranslations({
                "Name (Sinhala)": "සිංහල නම",
                "City (Sinhala)": "",
            }),
        ).toEqual({ si: { ...emptyEntry, name: "සිංහල නම" } });
    });

    it("clears the translations when every Sinhala cell is empty", () => {
        expect(
            parseSheetTranslations({ "Name (Sinhala)": " ", Name: "Home" }),
        ).toBeNull();
    });

    it("keeps the saved translations when the sheet has no Sinhala columns", () => {
        expect(parseSheetTranslations({ Name: "Home" })).toBeUndefined();
    });
});

describe("normalizeTranslations", () => {
    it("trims the values and leaves empty ones out", () => {
        expect(
            normalizeTranslations({
                si: {
                    ...emptyEntry,
                    name: " සිංහල නම ",
                    city: "",
                    address: "   ",
                },
            }),
        ).toEqual({ si: { ...emptyEntry, name: "සිංහල නම" } });
    });

    it("clears the translations when every value is empty", () => {
        expect(
            normalizeTranslations({ si: { ...emptyEntry, name: " " } }),
        ).toBeNull();
    });

    it.each([
        ["null", null],
        ["undefined", undefined],
        ["a string", "සිංහල"],
        ["a Sinhala entry that isn't an object", { si: "සිංහල" }],
    ])("treats %s as no translations", (_, value) => {
        expect(normalizeTranslations(value)).toBeNull();
    });

    it("ignores values that aren't strings, and unknown languages and fields", () => {
        expect(
            normalizeTranslations({
                si: {
                    name: 42,
                    city: ["මහනුවර"],
                    managedBy: "සහෝදරියන්",
                    x: "y",
                },
                fr: { name: "Maison" },
            }),
        ).toEqual({ si: { ...emptyEntry, managedBy: "සහෝදරියන්" } });
    });
});
