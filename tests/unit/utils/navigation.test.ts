import { describe, expect, it } from "vitest";

import {
    adminMenuItem,
    facilityEditPath,
    getMobileMenuItems,
    mainMenuItems,
} from "@/utils/navigation";

describe("getMobileMenuItems", () => {
    it("returns only the main items outside an admin session", () => {
        expect(getMobileMenuItems(false)).toEqual(mainMenuItems);
        expect(getMobileMenuItems(false)).not.toContainEqual(adminMenuItem);
    });

    it("appends the Admin Session item during an admin session", () => {
        const items = getMobileMenuItems(true);

        expect(items).toEqual([...mainMenuItems, adminMenuItem]);
        expect(items.at(-1)).toEqual({
            label: "Admin Session",
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
