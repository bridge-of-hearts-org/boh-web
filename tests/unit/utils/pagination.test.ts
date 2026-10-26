import { describe, expect, it } from "vitest";

import { lastPage, parseItemsPerPage, parsePage } from "@/utils/pagination";

describe("parsePage", () => {
    it.each([
        ["3", 3],
        [2, 2],
        ["2.9", 2],
    ])("parses %s as page %s", (value, expected) => {
        expect(parsePage(value)).toBe(expected);
    });

    it.each([
        undefined,
        null,
        "",
        "abc",
        "0",
        "-1",
        0,
        -3,
        NaN,
        Infinity,
        ["2", "3"],
    ])("falls back to page 1 for %s", (value) => {
        expect(parsePage(value)).toBe(1);
    });

    it("caps a huge page number so the database skip stays small", () => {
        expect(parsePage("1e20")).toBe(1_000_000);
    });
});

describe("parseItemsPerPage", () => {
    it.each([
        ["25", 25],
        [50, 50],
        ["10.5", 10],
        ["1000", 1000],
    ])("parses %s as %s items per page", (value, expected) => {
        expect(parseItemsPerPage(value)).toBe(expected);
    });

    it.each([undefined, null, "", "abc", "0", "-5", NaN, Infinity])(
        "falls back to the default page size for %s",
        (value) => {
            expect(parseItemsPerPage(value)).toBe(10);
        },
    );

    it("caps the page size at 1000", () => {
        expect(parseItemsPerPage("5000")).toBe(1000);
    });
});

describe("lastPage", () => {
    it.each([
        [370, 10, 37],
        [371, 10, 38],
        [5, 10, 1],
        [0, 10, 1],
    ])(
        "%s results at %s per page end on page %s",
        (total, perPage, expected) => {
            expect(lastPage(total, perPage)).toBe(expected);
        },
    );
});
