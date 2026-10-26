import { describe, expect, it } from "vitest";

import { emptyChildCareFacilityDbObject } from "@/utils/defines";
import {
    coordsToText,
    parseCoordinates,
    validateFacility,
} from "@/utils/facilityForm";

describe("validateFacility", () => {
    const facility = {
        ...emptyChildCareFacilityDbObject,
        slug: "home",
        name: "Home",
    };

    it("accepts a facility with a slug and a name", () => {
        expect(validateFacility(facility)).toBe("success");
    });

    it("requires a slug", () => {
        expect(validateFacility({ ...facility, slug: "" })).toBe(
            "Slug is required",
        );
    });

    it("requires a name", () => {
        expect(validateFacility({ ...facility, name: "" })).toBe(
            "Name is required",
        );
    });

    it("reports the missing slug first", () => {
        expect(validateFacility({ ...facility, slug: "", name: "" })).toBe(
            "Slug is required",
        );
    });
});

describe("coordsToText", () => {
    const location = emptyChildCareFacilityDbObject.location;

    it("formats stored coordinates", () => {
        expect(
            coordsToText({ ...location, latitude: 7.2906, longitude: -80.5 }),
        ).toEqual(["7.2906", "-80.5"]);
    });

    it("leaves both fields empty without coordinates", () => {
        expect(
            coordsToText({ ...location, latitude: null, longitude: null }),
        ).toEqual(["", ""]);
        expect(
            coordsToText({ ...location, latitude: 0, longitude: 0 }),
        ).toEqual(["", ""]);
    });
});

describe("parseCoordinates", () => {
    const LATITUDE_ERROR = "Latitude must be a number between -90 and 90";
    const LONGITUDE_ERROR = "Longitude must be a number between -180 and 180";

    it("parses valid coordinates", () => {
        expect(parseCoordinates("7.2906", "80.6337")).toEqual({
            coords: { latitude: 7.2906, longitude: 80.6337 },
        });
    });

    it("parses negative and integer coordinates", () => {
        expect(parseCoordinates("-33", "-151.2093")).toEqual({
            coords: { latitude: -33, longitude: -151.2093 },
        });
    });

    it("trims surrounding whitespace", () => {
        expect(parseCoordinates("  7.2906 ", " 80.6337  ")).toEqual({
            coords: { latitude: 7.2906, longitude: 80.6337 },
        });
    });

    it("treats both fields empty as no coordinates", () => {
        expect(parseCoordinates("", "")).toEqual({ coords: null });
        expect(parseCoordinates("  ", " ")).toEqual({ coords: null });
    });

    it.each([
        ["7.2906", ""],
        ["", "80.6337"],
        [" ", "80.6337"],
    ])("requires both fields (%j, %j)", (lat, lng) => {
        expect(parseCoordinates(lat, lng)).toEqual({
            error: "Enter both latitude and longitude, or leave both empty",
        });
    });

    it.each(["7.2a", "1e1", "7.", ".5", "+7", "7,29", "0x7"])(
        "rejects the non-decimal latitude %j",
        (lat) => {
            expect(parseCoordinates(lat, "80.6337")).toEqual({
                error: LATITUDE_ERROR,
            });
        },
    );

    it("rejects a non-decimal longitude", () => {
        expect(parseCoordinates("7.2906", "abc")).toEqual({
            error: LONGITUDE_ERROR,
        });
    });

    it("accepts the range boundaries", () => {
        expect(parseCoordinates("-90", "180")).toEqual({
            coords: { latitude: -90, longitude: 180 },
        });
    });

    it("rejects an out-of-range latitude", () => {
        expect(parseCoordinates("90.1", "80")).toEqual({
            error: LATITUDE_ERROR,
        });
    });

    it("rejects an out-of-range longitude", () => {
        expect(parseCoordinates("7", "-180.1")).toEqual({
            error: LONGITUDE_ERROR,
        });
    });
});
