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

    test("toggle button is prominent with a map icon", async ({ page }) => {
        const toggle = page.getByRole("button", { name: /show map/i });
        await expect(toggle).toBeVisible();
        await expect(toggle.locator("svg").first()).toBeVisible();

        // A filled button rather than the page background
        const background = await toggle.evaluate(
            (el) => getComputedStyle(el).backgroundColor,
        );
        expect(background).not.toMatch(/^rgba?\(255, 255, 255(, 1)?\)$/);
        expect(background).not.toBe("rgba(0, 0, 0, 0)");
    });

    test("toggle button spans the width on mobile", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 800 });
        const toggle = page.getByRole("button", { name: /show map/i });
        await expect(toggle).toBeVisible();
        const toggleBox = await toggle.boundingBox();
        const parentBox = await toggle.locator("..").boundingBox();
        expect(toggleBox?.width).toBeCloseTo(parentBox?.width ?? 0, 0);
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

    test("clicking a marker shows InfoWindow with facility and Google Maps links", async ({
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
        const infoWindow = page.getByTestId("map-infowindow");
        await expect(
            infoWindow.getByRole("link", { name: /more info/i }),
        ).toHaveAttribute("href", /\/facility\//);
        // The named place (or a coordinate search), not coordinate directions,
        // which snap to the nearest business Google knows
        const placeLink = infoWindow.getByRole("link", {
            name: /open in google maps/i,
        });
        await expect(placeLink).toHaveAttribute("target", "_blank");
        const placeHref = new URL((await placeLink.getAttribute("href")) ?? "");
        expect(placeHref.protocol).toBe("https:");
        expect(placeHref.hostname).toMatch(/(^|\.)(google\.[a-z.]+|goo\.gl)$/);
        expect(placeHref.pathname).not.toMatch(/^\/maps\/dir\//);
        await expect(
            infoWindow.getByRole("link", { name: /get directions/i }),
        ).toHaveCount(0);
    });

    test("map stays open when navigating to a different page of results", async ({
        page,
    }) => {
        await page.goto("/directory?itemsPerPage=50");
        await page.getByRole("button", { name: /show map/i }).click();
        const markers = await facilityMarkers(page);
        await expect(markers.first()).toBeVisible({ timeout: 15000 });

        // Client-side paging keeps the same map, still showing markers
        await page.locator('button[name="Go to next page"]').first().click();
        await expect(page).toHaveURL(/page=2/);
        await expect(markers.first()).toBeVisible({ timeout: 15000 });

        // A full reload restores the open map from sessionStorage
        await page.reload();
        await expect(page.getByTestId("directory-map")).toBeVisible({
            timeout: 10000,
        });
    });
});
