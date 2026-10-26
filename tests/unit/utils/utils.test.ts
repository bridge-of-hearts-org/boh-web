import { afterEach, describe, expect, it, vi } from "vitest";

import { abortAfter, removeKeys } from "@/utils/utils";

describe("removeKeys", () => {
    it("removes the listed keys and keeps the rest", () => {
        const obj = { id: "1", name: "Home", slug: "home" };

        expect(removeKeys(obj, ["id", "slug"])).toEqual({ name: "Home" });
    });

    it("doesn't mutate the input", () => {
        const obj = { id: "1", name: "Home" };

        removeKeys(obj, ["id"]);

        expect(obj).toEqual({ id: "1", name: "Home" });
    });

    it("returns a copy when no keys are given", () => {
        const obj = { id: "1" };
        const result = removeKeys(obj, []);

        expect(result).toEqual(obj);
        expect(result).not.toBe(obj);
    });

    it("ignores keys that aren't set", () => {
        const obj: { id?: string; name: string } = { name: "Home" };

        expect(removeKeys(obj, ["id"])).toEqual({ name: "Home" });
    });
});

describe("abortAfter", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("aborts with an AbortError once the time is up", () => {
        vi.useFakeTimers();
        const { signal } = abortAfter(5000);

        vi.advanceTimersByTime(4999);
        expect(signal.aborted).toBe(false);

        vi.advanceTimersByTime(1);
        expect(signal.aborted).toBe(true);
        /* @vercel/blob only stops retrying on an AbortError */
        expect((signal.reason as DOMException).name).toBe("AbortError");
    });

    it("never aborts once cancelled", () => {
        vi.useFakeTimers();
        const { signal, cancel } = abortAfter(5000);

        cancel();
        vi.advanceTimersByTime(10000);
        expect(signal.aborted).toBe(false);
    });
});
