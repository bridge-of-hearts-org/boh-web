import { describe, expect, it } from "vitest";

import {
    adminRedirectPath,
    defaultLocale,
    isAdminPath,
    localizedPath,
    otherLocale,
} from "@/utils/locale";

describe("localizedPath", () => {
    it("leaves English paths unprefixed", () => {
        expect(defaultLocale).toBe("en");
        expect(localizedPath("en", "/")).toBe("/");
        expect(localizedPath("en", "/directory")).toBe("/directory");
    });

    it("prefixes Sinhala paths", () => {
        expect(localizedPath("si", "/")).toBe("/si");
        expect(localizedPath("si", "/facility/abc")).toBe("/si/facility/abc");
    });

    it("keeps the query string", () => {
        expect(localizedPath("si", "/directory?page=2")).toBe(
            "/si/directory?page=2",
        );
        expect(localizedPath("si", "/?ref=x")).toBe("/si?ref=x");
        expect(localizedPath("en", "/directory?page=2")).toBe(
            "/directory?page=2",
        );
    });
});

describe("otherLocale", () => {
    it("switches between English and Sinhala", () => {
        expect(otherLocale("en")).toBe("si");
        expect(otherLocale("si")).toBe("en");
    });
});

describe("adminRedirectPath", () => {
    it("strips the locale prefix from admin pages", () => {
        expect(adminRedirectPath("/si/admin")).toBe("/admin");
        expect(adminRedirectPath("/si/admin/login")).toBe("/admin/login");
        expect(adminRedirectPath("/si/facility/new")).toBe("/facility/new");
        expect(adminRedirectPath("/si/facility/edit/abc")).toBe(
            "/facility/edit/abc",
        );
    });

    it("ignores public pages", () => {
        expect(adminRedirectPath("/si")).toBeNull();
        expect(adminRedirectPath("/si/directory")).toBeNull();
        expect(adminRedirectPath("/si/facility/abc")).toBeNull();
        expect(adminRedirectPath("/si/facility/new-hope-home")).toBeNull();
        expect(adminRedirectPath("/si/administrator")).toBeNull();
    });

    it("ignores English paths", () => {
        expect(adminRedirectPath("/admin")).toBeNull();
        expect(adminRedirectPath("/facility/edit/abc")).toBeNull();
    });
});

describe("isAdminPath", () => {
    it("matches admin pages", () => {
        expect(isAdminPath("/admin")).toBe(true);
        expect(isAdminPath("/admin/login")).toBe(true);
        expect(isAdminPath("/facility/new")).toBe(true);
        expect(isAdminPath("/facility/edit/abc")).toBe(true);
    });

    it("ignores public pages", () => {
        expect(isAdminPath("/")).toBe(false);
        expect(isAdminPath("/administrator")).toBe(false);
        expect(isAdminPath("/facility/abc")).toBe(false);
        expect(isAdminPath("/facility/new-hope-home")).toBe(false);
    });
});
