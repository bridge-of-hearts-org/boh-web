import { test, expect } from "@playwright/test";

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

    test("map has pins for current results", async ({ page }) => {
        await page.getByRole("button", { name: /show map/i }).click();
        await expect(page.getByTestId("directory-map")).toBeVisible({
            timeout: 10000,
        });
        await expect(
            page.getByTestId("map-pins-list").locator("li"),
        ).not.toHaveCount(0, { timeout: 10000 });
    });

    test("clicking a marker shows InfoWindow with a facility link", async ({
        page,
    }) => {
        await page.getByRole("button", { name: /show map/i }).click();
        await page.waitForSelector('[data-testid="directory-map"]');
        const firstMarker = page
            .locator('img[src*="marker-icon"]')
            .first();
        await firstMarker.click();
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
