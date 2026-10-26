import { describe, expect, it } from "vitest";

import {
    DistrictsList,
    emptyFilter,
    ProvincesList,
    ProvinceToDistrict,
} from "@/utils/defines";

describe("administrative areas", () => {
    it("lists Sri Lanka's 9 provinces and 25 districts", () => {
        expect(ProvincesList).toHaveLength(9);
        expect(DistrictsList).toHaveLength(25);
    });

    it("has no duplicate provinces or districts", () => {
        expect(new Set(ProvincesList).size).toBe(ProvincesList.length);
        expect(new Set(DistrictsList).size).toBe(DistrictsList.length);
    });

    it("maps exactly the provinces in ProvincesList", () => {
        expect(Object.keys(ProvinceToDistrict).sort()).toEqual(
            [...ProvincesList].sort(),
        );
    });

    it("assigns every district to exactly one province", () => {
        const mapped = Object.values(ProvinceToDistrict).flat();

        expect(mapped).toHaveLength(DistrictsList.length);
        expect([...mapped].sort()).toEqual([...DistrictsList].sort());
    });
});

describe("emptyFilter", () => {
    it("has every filter field empty", () => {
        expect(emptyFilter).toEqual({
            name: "",
            city: "",
            managedBy: "",
            district: "",
            province: "",
        });
    });
});
