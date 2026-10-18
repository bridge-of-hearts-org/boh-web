import { test, expect, type Page } from "@playwright/test";

// Google Maps renders each clickable marker as a div[role="button"] labelled
// with the marker's title; map controls are plain <button> elements, so they don't match
function mapMarkers(page: Page) {
    return page
        .getByTestId("directory-map")
        .locator('div[role="button"][aria-label]');
}

test.describe("Directory map widget", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/directory");
    });

    test("toggle button is visible and map is hidden by default", async ({
        page,
    }) => {
        await expect(
            page.getByRole("button", { name: /show map/i }),
        ).toBeVisible();
        await expect(page.getByTestId("directory-map")).not.toBeVisible();
    });

    test("clicking toggle shows the map", async ({ page }) => {
        await page.getByRole("button", { name: /show map/i }).click();
        await expect(page.getByTestId("directory-map")).toBeVisible({
            timeout: 10000,
        });
    });

    test("map renders a marker for matching facilities", async ({ page }) => {
        await page.getByRole("button", { name: /show map/i }).click();
        await expect(mapMarkers(page).first()).toBeVisible({
            timeout: 15000,
        });
    });

    test("clicking a marker shows InfoWindow with a facility link", async ({
        page,
    }) => {
        await page.getByRole("button", { name: /show map/i }).click();
        const firstMarker = mapMarkers(page).first();
        await expect(firstMarker).toBeVisible({ timeout: 15000 });
        // Markers can overlap at country zoom; force the click so an overlapping
        // marker on top doesn't block it (either marker opens an InfoWindow)
        await firstMarker.click({ force: true });
        await expect(page.getByTestId("map-infowindow")).toBeVisible({
            timeout: 5000,
        });
        await expect(
            page.getByTestId("map-infowindow").locator("a"),
        ).toHaveAttribute("href", /\/facility\//);
    });

    test("map stays open when navigating to a different page of results", async ({
        page,
    }) => {
        await page.getByRole("button", { name: /show map/i }).click();
        await expect(page.getByTestId("directory-map")).toBeVisible({
            timeout: 10000,
        });
        await page.goto("/directory?page=2");
        await expect(page.getByTestId("directory-map")).toBeVisible({
            timeout: 10000,
        });
    });
});
