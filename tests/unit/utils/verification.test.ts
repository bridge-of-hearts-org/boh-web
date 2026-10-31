import { describe, expect, it } from "vitest";

import {
    clearAgeRangesVerification,
    clearOccupancyVerification,
    findAgeRangesVerifiedDate,
    findOccupancyVerifiedDate,
    findVerifiedDate,
    formatVerifiedDate,
    normalizeVerification,
    parseVerifiedDate,
    setVerifiedDate,
    toDateInputValue,
    verifyAgeRanges,
    verifyOccupancy,
} from "@/utils/verification";

const march12 = new Date("2026-03-12T00:00:00Z");
const march20 = new Date("2026-03-20T00:00:00Z");

describe("parseVerifiedDate", () => {
    it("parses a YYYY-MM-DD date as midnight UTC", () => {
        expect(parseVerifiedDate(" 2026-03-12 ")).toEqual(march12);
    });

    it.each([
        "",
        "12/03/2026",
        "2026-3-12",
        "2026-02-30",
        "2026-13-01",
        "soon",
    ])("rejects %j", (text) => {
        expect(parseVerifiedDate(text)).toBeNull();
    });
});

describe("toDateInputValue", () => {
    it("formats a date for a date input", () => {
        expect(toDateInputValue(march12)).toBe("2026-03-12");
    });

    it.each([null, undefined, new Date("invalid")])(
        "returns an empty value for %j",
        (date) => {
            expect(toDateInputValue(date)).toBe("");
        },
    );
});

describe("formatVerifiedDate", () => {
    it("shows the stored day in a readable format", () => {
        expect(formatVerifiedDate(march12)).toBe("12 March 2026");
    });

    it("formats the date in Sinhala on Sinhala pages", () => {
        expect(formatVerifiedDate(march12, "si")).toBe("2026 මාර්තු 12");
    });
});

describe("findVerifiedDate and setVerifiedDate", () => {
    const list = [{ value: "0771234567", verifiedAt: march12 }];

    it("finds the date for a verified value", () => {
        expect(findVerifiedDate(list, "0771234567")).toEqual(march12);
        expect(findVerifiedDate(list, "0812345678")).toBeNull();
        expect(findVerifiedDate(undefined, "0771234567")).toBeNull();
    });

    it("replaces a value's date", () => {
        expect(setVerifiedDate(list, "0771234567", march20)).toEqual([
            { value: "0771234567", verifiedAt: march20 },
        ]);
    });

    it("removes a value's verification when the date is null", () => {
        expect(setVerifiedDate(list, "0771234567", null)).toEqual([]);
    });
});

describe("occupancy verification", () => {
    const counts = { total: 30, male: null, female: 30 };

    it("is verified while the counts match the verified ones", () => {
        const verification = {
            phones: [],
            emails: [],
            occupancy: verifyOccupancy(counts, march12),
            ageRanges: null,
        };

        expect(findOccupancyVerifiedDate(counts, verification)).toEqual(
            march12,
        );
        /* The form stores an empty count as 0 */
        expect(
            findOccupancyVerifiedDate({ ...counts, male: 0 }, verification),
        ).toEqual(march12);
    });

    it("isn't verified once the counts change", () => {
        const verification = {
            phones: [],
            emails: [],
            occupancy: verifyOccupancy(counts, march12),
            ageRanges: null,
        };

        expect(
            findOccupancyVerifiedDate({ ...counts, total: 31 }, verification),
        ).toBeNull();
        expect(findOccupancyVerifiedDate(counts, null)).toBeNull();
    });

    it("removes the verification when the date is null", () => {
        expect(verifyOccupancy(counts, null)).toBeNull();
    });

    it("clearing the date removes a verification of the current counts", () => {
        expect(
            clearOccupancyVerification(
                counts,
                verifyOccupancy(counts, march12),
            ),
        ).toBeNull();
        expect(clearOccupancyVerification(counts, null)).toBeNull();
    });

    it("clearing the date keeps a saved verification of other counts", () => {
        const saved = verifyOccupancy({ ...counts, total: 29 }, march12);

        expect(clearOccupancyVerification(counts, saved)).toEqual(saved);
    });
});

describe("age ranges verification", () => {
    const ages = { all: "5-18", male: null, female: "5-18" };

    it("is verified while the age ranges match the verified ones", () => {
        const verification = {
            phones: [],
            emails: [],
            occupancy: null,
            ageRanges: verifyAgeRanges(ages, march12),
        };

        expect(findAgeRangesVerifiedDate(ages, verification)).toEqual(march12);
        /* The form stores an empty age range as "" */
        expect(
            findAgeRangesVerifiedDate({ ...ages, male: "" }, verification),
        ).toEqual(march12);
        expect(
            findAgeRangesVerifiedDate({ ...ages, all: "6-18" }, verification),
        ).toBeNull();
        expect(findAgeRangesVerifiedDate(ages, null)).toBeNull();
    });

    it("clearing the date keeps only a saved verification of other age ranges", () => {
        const saved = verifyAgeRanges({ ...ages, all: "6-18" }, march12);

        expect(clearAgeRangesVerification(ages, saved)).toEqual(saved);
        expect(
            clearAgeRangesVerification(ages, verifyAgeRanges(ages, march12)),
        ).toBeNull();
        expect(verifyAgeRanges(ages, null)).toBeNull();
    });
});

describe("normalizeVerification", () => {
    const contact = {
        phone: ["0771234567"],
        email: ["home@example.com"],
        website: "",
        facebook: "",
        instagram: "",
    };

    it("drops verifications for values that aren't listed", () => {
        expect(
            normalizeVerification({
                contact,
                verification: {
                    phones: [
                        { value: "0771234567", verifiedAt: march12 },
                        { value: "0812345678", verifiedAt: march12 },
                    ],
                    emails: [{ value: "old@example.com", verifiedAt: march12 }],
                    occupancy: null,
                    ageRanges: null,
                },
            }),
        ).toEqual({
            phones: [{ value: "0771234567", verifiedAt: march12 }],
            emails: [],
            occupancy: null,
            ageRanges: null,
        });
    });

    it("drops invalid dates and accepts dates sent as strings", () => {
        expect(
            normalizeVerification({
                contact,
                verification: {
                    phones: [
                        {
                            value: "0771234567",
                            verifiedAt: "2026-03-12T00:00:00.000Z" as any,
                        },
                    ],
                    emails: [
                        {
                            value: "home@example.com",
                            verifiedAt: new Date("invalid"),
                        },
                    ],
                    occupancy: {
                        total: 30,
                        male: null,
                        female: 30,
                        verifiedAt: "" as any,
                    },
                    ageRanges: {
                        all: " 5-18 ",
                        male: null,
                        female: null,
                        verifiedAt: "2026-03-12T00:00:00.000Z" as any,
                    },
                },
            }),
        ).toEqual({
            phones: [{ value: "0771234567", verifiedAt: march12 }],
            emails: [],
            occupancy: null,
            ageRanges: {
                all: "5-18",
                male: null,
                female: null,
                verifiedAt: march12,
            },
        });
    });

    it("keeps one verification per value", () => {
        expect(
            normalizeVerification({
                contact,
                verification: {
                    phones: [
                        { value: "0771234567", verifiedAt: march12 },
                        { value: "0771234567", verifiedAt: march20 },
                    ],
                    emails: [],
                    occupancy: null,
                    ageRanges: null,
                },
            })?.phones,
        ).toEqual([{ value: "0771234567", verifiedAt: march20 }]);
    });

    it("returns null when nothing is verified", () => {
        expect(
            normalizeVerification({ contact, verification: null }),
        ).toBeNull();
        expect(
            normalizeVerification({
                contact,
                verification: {
                    phones: [],
                    emails: [],
                    occupancy: null,
                    ageRanges: null,
                },
            }),
        ).toBeNull();
    });
});
