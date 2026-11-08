import { describe, expect, it } from "vitest";

import {
    adminMenuItem,
    facilityEditPath,
    getMobileMenuItems,
    mainMenuItems,
    pathWithSearch,
} from "@/utils/navigation";

describe("getMobileMenuItems", () => {
    it("returns only the main items outside an admin session", () => {
        expect(getMobileMenuItems(false)).toEqual(mainMenuItems);
        expect(getMobileMenuItems(false)).not.toContainEqual(adminMenuItem);
    });

    it("puts the Admin item first during an admin session", () => {
        const items = getMobileMenuItems(true);

        expect(items).toEqual([adminMenuItem, ...mainMenuItems]);
        expect(items[0]).toEqual({
            label: "Admin",
            href: "/admin",
        });
    });

    it("does not mutate the shared main items list", () => {
        const before = [...mainMenuItems];
        getMobileMenuItems(true).push({ label: "Extra", href: "/extra" });
        getMobileMenuItems(false).push({ label: "Extra", href: "/extra" });

        expect(mainMenuItems).toEqual(before);
    });
});

describe("facilityEditPath", () => {
    it("builds the edit page path from the slug", () => {
        expect(facilityEditPath("sunshine-home-kandy")).toBe(
            "/facility/edit/sunshine-home-kandy",
        );
    });
});

describe("pathWithSearch", () => {
    it("appends the query string", () => {
        expect(pathWithSearch("/directory", "page=2&city=Kandy")).toBe(
            "/directory?page=2&city=Kandy",
        );
    });

    it("returns the path alone when there is no query string", () => {
        expect(pathWithSearch("/about", "")).toBe("/about");
    });
});
