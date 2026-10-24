import { test, expect } from "@playwright/test";

// A facility known to have a Google Maps link in the database
const FACILITY_WITH_MAP = "memon-charitable-foundation-childrens-home-kaleliya";

// A facility known to have no Google Maps link
const FACILITY_WITHOUT_MAP = "mawupiya-sewana-childrens-home-gonapola";

// A facility whose name also matches an unrelated place abroad, with stored coordinates
const FACILITY_WITH_AMBIGUOUS_NAME = "st-leonards-childrens-home-gampola";
const AMBIGUOUS_NAME_COORDINATES = "7.1654797,80.5736322";

// The Maps JavaScript API script tag that @react-google-maps/api adds
const MAPS_SCRIPT = "script#script-loader";

test.describe("Facility location map", () => {
    test("shows a map when a Google Maps link is available", async ({
        page,
    }) => {
        await page.goto(`/facility/${FACILITY_WITH_MAP}`);
        // Our own map when the facility has coordinates, otherwise the embed
        const map = page
            .getByTestId("facility-location-map")
            .or(page.locator('iframe[title="Facility location map"]'));
        await expect(map).toBeVisible({ timeout: 10000 });
    });

    test("shows a Google Maps hyphen row when no Maps link is available", async ({
        page,
    }) => {
        await page.goto(`/facility/${FACILITY_WITHOUT_MAP}`);
        await expect(
            page.locator('iframe[title="Facility location map"]'),
        ).not.toBeVisible();
        await expect(page.getByTestId("facility-location-map")).toHaveCount(0);
        await expect(
            page.getByText("Google Maps").locator("..").getByText("-"),
        ).toBeVisible({ timeout: 10000 });
    });

    test("pins the stored coordinates and links the place name from the pin", async ({
        page,
    }) => {
        await page.goto(`/facility/${FACILITY_WITH_AMBIGUOUS_NAME}`);
        const name = (
            await page.getByRole("heading", { level: 1 }).first().textContent()
        )?.trim();
        expect(name).toBeTruthy();

        const map = page.getByTestId("facility-location-map");
        await map.scrollIntoViewIfNeeded();
        const marker = map.getByRole("button", { name, exact: true });
        await expect(marker).toBeVisible({ timeout: 15000 });
        await marker.click();

        const infoWindow = page.getByTestId("facility-map-infowindow");
        await expect(infoWindow).toBeVisible({ timeout: 5000 });

        const placeLink = infoWindow.getByRole("link", { name });
        await expect(placeLink).toHaveAttribute("target", "_blank");
        const placeHref = new URL((await placeLink.getAttribute("href")) ?? "");
        expect(placeHref.hostname).toMatch(/(^|\.)(google\.[a-z.]+|goo\.gl)$/);

        await expect(
            infoWindow.getByRole("link", { name: /get directions/i }),
        ).toHaveAttribute(
            "href",
            `https://www.google.com/maps/dir/?api=1&destination=${AMBIGUOUS_NAME_COORDINATES}`,
        );
    });

    test("loads the map only once it scrolls into view", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 400 });
        await page.goto(`/facility/${FACILITY_WITH_AMBIGUOUS_NAME}`);

        const map = page.getByTestId("facility-location-map");
        await expect(map).toBeAttached({ timeout: 10000 });
        // Let the page hydrate first, so an eager load would have started by now
        await page.waitForLoadState("networkidle");
        await expect(map).not.toBeInViewport();
        await expect(page.locator(MAPS_SCRIPT)).toHaveCount(0);

        await map.scrollIntoViewIfNeeded();
        await expect(page.locator(MAPS_SCRIPT)).toBeAttached({
            timeout: 10000,
        });
    });

    test("links to the facility's Google Maps page below the map", async ({
        page,
    }) => {
        await page.goto(`/facility/${FACILITY_WITH_MAP}`);
        const openInMaps = page.getByRole("link", {
            name: "Open in Google Maps",
        });
        await expect(openInMaps).toBeVisible({ timeout: 10000 });
        await expect(openInMaps).toHaveAttribute("target", "_blank");

        const href = new URL((await openInMaps.getAttribute("href")) ?? "");
        expect(href.protocol).toBe("https:");
        expect(href.hostname).toMatch(/(^|\.)(google\.[a-z.]+|goo\.gl)$/);
        /* The stored Maps URL, not the coordinate search fallback */
        expect(href.pathname).not.toBe("/maps/search/");
    });
});
