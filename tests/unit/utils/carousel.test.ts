import { describe, expect, it } from "vitest";

import {
    MAX_PHOTO_DOTS,
    MIN_SWIPE_DISTANCE,
    showsPhotoDots,
    stepIndex,
    swipeStep,
} from "@/utils/carousel";

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
    const start = { x: 100, y: 100 };

    it("goes to the next photo on a swipe to the left", () => {
        expect(swipeStep(start, { x: 100 - MIN_SWIPE_DISTANCE, y: 100 })).toBe(
            1,
        );
    });

    it("goes to the previous photo on a swipe to the right", () => {
        expect(swipeStep(start, { x: 100 + MIN_SWIPE_DISTANCE, y: 100 })).toBe(
            -1,
        );
    });

    it("counts a slightly diagonal swipe", () => {
        expect(swipeStep(start, { x: 30, y: 120 })).toBe(1);
    });

    it("ignores movements shorter than a swipe", () => {
        expect(
            swipeStep(start, { x: 100 + MIN_SWIPE_DISTANCE - 1, y: 100 }),
        ).toBe(0);
        expect(
            swipeStep(start, { x: 100 - MIN_SWIPE_DISTANCE + 1, y: 100 }),
        ).toBe(0);
        expect(swipeStep(start, start)).toBe(0);
    });

    it("ignores a mostly vertical movement, which scrolls the page", () => {
        expect(swipeStep(start, { x: 50, y: 300 })).toBe(0);
        expect(swipeStep(start, { x: 150, y: -100 })).toBe(0);
    });
});

describe("showsPhotoDots", () => {
    it("shows dots for up to MAX_PHOTO_DOTS photos", () => {
        expect(showsPhotoDots(2)).toBe(true);
        expect(showsPhotoDots(MAX_PHOTO_DOTS)).toBe(true);
    });

    it("shows a counter for more photos", () => {
        expect(showsPhotoDots(MAX_PHOTO_DOTS + 1)).toBe(false);
    });
});
