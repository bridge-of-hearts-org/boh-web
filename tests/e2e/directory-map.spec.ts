import { test, expect, type Page } from "@playwright/test";

function escapeRegExp(text: string) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Markers are found by their accessible name (each marker is titled with its
// facility's name), matched against the facility names listed on the page
async function facilityMarkers(page: Page) {
    const names = await page
        .getByRole("heading", { level: 2 })
        .allTextContents();
    expect(names.length).toBeGreaterThan(0);
    const pattern = new RegExp(
        `^(${names.map((n) => escapeRegExp(n.trim())).join("|")})$`,
    );
    return page
        .getByTestId("directory-map")
        .getByRole("button", { name: pattern });
}

test.describe("Directory map widget", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/directory");
    });

    test("toggle button is visible and map is hidden by default", async ({
        page,
    }) => {
        const toggle = page.getByRole("button", { name: /show map/i });
        await expect(toggle).toBeVisible();
        await expect(toggle).toHaveAttribute("aria-expanded", "false");
        await expect(page.getByTestId("directory-map")).not.toBeVisible();
    });

    test("clicking toggle shows and hides the map", async ({ page }) => {
        await page.getByRole("button", { name: /show map/i }).click();
        await expect(page.getByTestId("directory-map")).toBeVisible({
            timeout: 10000,
        });
        const hide = page.getByRole("button", { name: /hide map/i });
        await expect(hide).toHaveAttribute("aria-expanded", "true");
        await hide.click();
        await expect(page.getByTestId("directory-map")).not.toBeVisible();
    });

    test("map renders markers for listed facilities", async ({ page }) => {
        // A larger page makes it near-certain a listed facility has coordinates
        await page.goto("/directory?itemsPerPage=50");
        await page.getByRole("button", { name: /show map/i }).click();
        const markers = await facilityMarkers(page);
        await expect(markers.first()).toBeVisible({ timeout: 15000 });
    });

    test("clicking a marker shows InfoWindow with a facility link", async ({
        page,
    }) => {
        await page.goto("/directory?itemsPerPage=50");
        await page.getByRole("button", { name: /show map/i }).click();
        const firstMarker = (await facilityMarkers(page)).first();
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
