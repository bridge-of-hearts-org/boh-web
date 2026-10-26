import { describe, expect, it } from "vitest";

import { MIN_SWIPE_DISTANCE, stepIndex, swipeStep } from "@/utils/carousel";

describe("stepIndex", () => {
    it.each([
        [0, 1, 3, 1],
        [1, 1, 3, 2],
        [2, -1, 3, 1],
    ])(
        "moves from %s by %s of %s photos to %s",
        (index, step, count, expected) => {
            expect(stepIndex(index, step, count)).toBe(expected);
        },
    );

    it("wraps from the last photo to the first", () => {
        expect(stepIndex(2, 1, 3)).toBe(0);
    });

    it("wraps from the first photo to the last", () => {
        expect(stepIndex(0, -1, 3)).toBe(2);
    });

    it("stays on the only photo", () => {
        expect(stepIndex(0, 1, 1)).toBe(0);
        expect(stepIndex(0, -1, 1)).toBe(0);
    });

    it("stays at 0 for an empty list", () => {
        expect(stepIndex(0, 1, 0)).toBe(0);
        expect(stepIndex(0, -1, 0)).toBe(0);
    });
});

describe("swipeStep", () => {
    it("goes to the next photo on a swipe to the left", () => {
        expect(swipeStep(200, 200 - MIN_SWIPE_DISTANCE)).toBe(1);
    });

    it("goes to the previous photo on a swipe to the right", () => {
        expect(swipeStep(100, 100 + MIN_SWIPE_DISTANCE)).toBe(-1);
    });

    it("ignores movements shorter than a swipe", () => {
        expect(swipeStep(100, 100 + MIN_SWIPE_DISTANCE - 1)).toBe(0);
        expect(swipeStep(100, 100 - MIN_SWIPE_DISTANCE + 1)).toBe(0);
        expect(swipeStep(100, 100)).toBe(0);
    });
});
