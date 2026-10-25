import { describe, expect, it } from "vitest";

import {
    findOccupancyVerifiedDate,
    findVerifiedDate,
    formatVerifiedDate,
    normalizeVerification,
    parseVerifiedDate,
    setVerifiedDate,
    toDateInputValue,
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
        };

        expect(
            findOccupancyVerifiedDate({ ...counts, total: 31 }, verification),
        ).toBeNull();
        expect(findOccupancyVerifiedDate(counts, null)).toBeNull();
    });

    it("removes the verification when the date is null", () => {
        expect(verifyOccupancy(counts, null)).toBeNull();
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
                },
            }),
        ).toEqual({
            phones: [{ value: "0771234567", verifiedAt: march12 }],
            emails: [],
            occupancy: null,
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
                },
            }),
        ).toEqual({
            phones: [{ value: "0771234567", verifiedAt: march12 }],
            emails: [],
            occupancy: null,
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
                verification: { phones: [], emails: [], occupancy: null },
            }),
        ).toBeNull();
    });
});
