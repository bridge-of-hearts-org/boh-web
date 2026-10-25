import { describe, expect, it } from "vitest";

import { removeKeys } from "@/utils/utils";

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
