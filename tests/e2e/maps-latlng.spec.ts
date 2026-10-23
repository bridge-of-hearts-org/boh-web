import { test, expect } from "@playwright/test";

import { isGoogleMapsUrl, parseLatLngFromUrl } from "../../src/utils/maps";

// Pure parsing tests: no browser needed
test.describe("parseLatLngFromUrl", () => {
    test("prefers the place pin (!3d/!4d) over the map view centre (@)", () => {
        const url =
            "https://www.google.com/maps/place/Some+Home/@7.2000,80.6000,17z/data=!4m6!3m5!1s0x0:0x0!8m2!3d7.2906!4d80.6337";
        expect(parseLatLngFromUrl(url)).toEqual({
            latitude: 7.2906,
            longitude: 80.6337,
        });
    });

    test("falls back to @lat,lng", () => {
        const url =
            "https://www.google.com/maps/place/Some+Home/@7.2906,80.6337,17z";
        expect(parseLatLngFromUrl(url)).toEqual({
            latitude: 7.2906,
            longitude: 80.6337,
        });
    });

    test("falls back to ?q=lat,lng", () => {
        const url = "https://maps.google.com/maps?q=7.2906,80.6337";
        expect(parseLatLngFromUrl(url)).toEqual({
            latitude: 7.2906,
            longitude: 80.6337,
        });
    });

    test("unwraps Google consent redirects", () => {
        const target =
            "https://www.google.com/maps/place/Some+Home/@7.2906,80.6337,17z";
        const url = `https://consent.google.com/m?continue=${encodeURIComponent(target)}&gl=DE`;
        expect(parseLatLngFromUrl(url)).toEqual({
            latitude: 7.2906,
            longitude: 80.6337,
        });
    });

    test("returns null when there are no coordinates", () => {
        expect(
            parseLatLngFromUrl("https://www.google.com/maps/place/Some+Home"),
        ).toBeNull();
    });

    test("rejects out-of-range values", () => {
        expect(
            parseLatLngFromUrl("https://maps.google.com/maps?q=95.0,80.0"),
        ).toBeNull();
    });
});

test.describe("isGoogleMapsUrl", () => {
    test("accepts Google Maps URLs and shortlinks", () => {
        expect(isGoogleMapsUrl("https://maps.app.goo.gl/abc123")).toBe(true);
        expect(isGoogleMapsUrl("https://goo.gl/maps/abc123")).toBe(true);
        expect(isGoogleMapsUrl("https://www.google.com/maps/place/x")).toBe(
            true,
        );
        expect(isGoogleMapsUrl("https://maps.google.com/maps?q=1,2")).toBe(
            true,
        );
        expect(
            isGoogleMapsUrl(
                "https://www.google.lk/maps/place/x/@7.29,80.63,17z",
            ),
        ).toBe(true);
        expect(isGoogleMapsUrl("https://www.google.co.uk/maps/place/x")).toBe(
            true,
        );
    });

    test("rejects other hosts and non-maps Google paths", () => {
        expect(isGoogleMapsUrl("https://example.com/maps")).toBe(false);
        expect(isGoogleMapsUrl("https://www.google.com/search?q=x")).toBe(
            false,
        );
        expect(isGoogleMapsUrl("https://goo.gl/abc")).toBe(false);
        expect(isGoogleMapsUrl("https://www.google.com/mapsevil")).toBe(false);
        expect(isGoogleMapsUrl("https://consent.google.com/m?continue=x")).toBe(
            false,
        );
        expect(isGoogleMapsUrl("https://google.evil.com/maps/x")).toBe(false);
        expect(isGoogleMapsUrl("http://maps.app.goo.gl/abc123")).toBe(false);
        expect(isGoogleMapsUrl("file:///etc/passwd")).toBe(false);
        expect(isGoogleMapsUrl("not a url")).toBe(false);
    });
});

// Admin form tests: need admin credentials. Nothing is submitted, so no data is changed.
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;

test.describe("Latitude/longitude fields in the admin facility form", () => {
    test.skip(
        !adminUsername || !adminPassword,
        "Set ADMIN_USERNAME and ADMIN_PASSWORD to run admin form tests",
    );

    // A ?q= URL needs no redirect, so these tests don't depend on Google
    const mapsUrl = "https://maps.google.com/maps?q=7.2906,80.6337";

    test.beforeEach(async ({ page }) => {
        await page.goto(
            `/admin/login?callbackUrl=${encodeURIComponent("/facility/new")}`,
        );
        await page.locator("#username").fill(adminUsername!);
        await page.locator("#password").fill(adminPassword!);
        await page.getByRole("button", { name: "Login" }).click();
        await expect(page).toHaveURL(/\/facility\/new/, { timeout: 15000 });
    });

    test("resolve button is disabled until a URL is entered", async ({
        page,
    }) => {
        const resolveButton = page.getByRole("button", {
            name: "Resolve Latitude and Longitude",
        });
        await expect(resolveButton).toBeDisabled();

        await page.getByLabel("Google Maps", { exact: true }).fill(mapsUrl);
        await expect(resolveButton).toBeEnabled();
    });

    test("resolving fills empty fields without asking", async ({ page }) => {
        let dialogShown = false;
        page.on("dialog", (dialog) => {
            dialogShown = true;
            dialog.dismiss();
        });

        await page.getByLabel("Google Maps", { exact: true }).fill(mapsUrl);
        await page
            .getByRole("button", { name: "Resolve Latitude and Longitude" })
            .click();

        await expect(page.getByLabel("Latitude", { exact: true })).toHaveValue(
            "7.2906",
        );
        await expect(page.getByLabel("Longitude", { exact: true })).toHaveValue(
            "80.6337",
        );
        expect(dialogShown).toBe(false);
    });

    test("resolving over existing values asks first; Cancel keeps them", async ({
        page,
    }) => {
        await page.getByLabel("Latitude", { exact: true }).fill("6.9");
        await page.getByLabel("Longitude", { exact: true }).fill("79.9");
        await page.getByLabel("Google Maps", { exact: true }).fill(mapsUrl);

        const dialogMessages: string[] = [];
        page.on("dialog", (dialog) => {
            dialogMessages.push(dialog.message());
            dialog.dismiss();
        });
        await page
            .getByRole("button", { name: "Resolve Latitude and Longitude" })
            .click();

        await expect
            .poll(() => dialogMessages)
            .toEqual(["Replace 6.9, 79.9 with 7.2906, 80.6337?"]);

        await expect(page.getByLabel("Latitude", { exact: true })).toHaveValue(
            "6.9",
        );
        await expect(page.getByLabel("Longitude", { exact: true })).toHaveValue(
            "79.9",
        );
    });

    test("resolving over existing values asks first; Replace overwrites them", async ({
        page,
    }) => {
        await page.getByLabel("Latitude", { exact: true }).fill("6.9");
        await page.getByLabel("Longitude", { exact: true }).fill("79.9");
        await page.getByLabel("Google Maps", { exact: true }).fill(mapsUrl);

        page.once("dialog", (dialog) => dialog.accept());
        await page
            .getByRole("button", { name: "Resolve Latitude and Longitude" })
            .click();

        await expect(page.getByLabel("Latitude", { exact: true })).toHaveValue(
            "7.2906",
        );
        await expect(page.getByLabel("Longitude", { exact: true })).toHaveValue(
            "80.6337",
        );
    });

    test("shows an error when the URL has no coordinates", async ({ page }) => {
        await page
            .getByLabel("Google Maps", { exact: true })
            .fill("https://www.google.com/maps/place/Nowhere");
        await page
            .getByRole("button", { name: "Resolve Latitude and Longitude" })
            .click();

        await expect(
            page.getByText("Couldn't find coordinates in this URL"),
        ).toBeVisible();
        await expect(page.getByLabel("Latitude", { exact: true })).toHaveValue(
            "",
        );
        await expect(page.getByLabel("Longitude", { exact: true })).toHaveValue(
            "",
        );
    });

    test("rejects an out-of-range latitude on submit", async ({ page }) => {
        // Safety net: if validation ever regresses, don't let addFacility reach the database
        await page.route("**/*", (route) => {
            if (
                route.request().method() === "POST" &&
                route.request().headers()["next-action"]
            ) {
                return route.abort();
            }
            return route.continue();
        });

        // Slug and name are required before the coordinates are validated
        await page
            .locator("label", { hasText: "Database Slug" })
            .locator("+ input")
            .fill("e2e-latlng-validation");
        await page
            .locator("label", { hasText: /^Name$/ })
            .locator("+ input")
            .fill("E2E Lat/Lng Validation");
        await page.getByLabel("Latitude", { exact: true }).fill("95");
        await page.getByLabel("Longitude", { exact: true }).fill("80");

        // alert() blocks the click, so the dialog must be handled from a listener
        const dialogMessages: string[] = [];
        page.on("dialog", (dialog) => {
            dialogMessages.push(dialog.message());
            dialog.dismiss();
        });
        await page.getByRole("button", { name: "Submit" }).click();

        await expect
            .poll(() => dialogMessages)
            .toEqual(["Latitude must be a number between -90 and 90"]);
    });
});
