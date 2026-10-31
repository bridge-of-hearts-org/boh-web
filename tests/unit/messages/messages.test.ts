import { describe, expect, it } from "vitest";

import en from "../../../messages/en.json";
import si from "../../../messages/si.json";
import { DistrictsList, ProvincesList } from "@/utils/defines";

/* Every key path in a nested messages object, e.g. "Nav.home" */
function keyPaths(messages: object, prefix = ""): string[] {
    return Object.entries(messages).flatMap(([key, value]) =>
        typeof value === "object" && value !== null
            ? keyPaths(value, `${prefix}${key}.`)
            : [`${prefix}${key}`],
    );
}

describe("messages", () => {
    it("has the same keys in every language", () => {
        expect(keyPaths(si).sort()).toEqual(keyPaths(en).sort());
    });

    it("translates every province and district", () => {
        expect(Object.keys(si.Provinces).sort()).toEqual(
            [...ProvincesList].sort(),
        );
        expect(Object.keys(si.Districts).sort()).toEqual(
            [...DistrictsList].sort(),
        );
    });
});
