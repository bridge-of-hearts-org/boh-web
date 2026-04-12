import { test, expect } from "@playwright/test";

// A facility known to have a Google Maps link in the database
const FACILITY_WITH_MAP = "memon-charitable-foundation-childrens-home-kaleliya";

// A facility known to have no Google Maps link
const FACILITY_WITHOUT_MAP = "mawupiya-sewana-childrens-home-gonapola";

test.describe("Google Maps embed on facility profile page", () => {
    test("shows the map iframe when a Google Maps link is available", async ({
        page,
    }) => {
        await page.goto(`/facility/${FACILITY_WITH_MAP}`);
        const mapIframe = page.locator('iframe[title="Facility location map"]');
        await expect(mapIframe).toBeVisible({ timeout: 10000 });
    });

    test("shows a Google Maps hyphen row when no Maps link is available", async ({
        page,
    }) => {
        await page.goto(`/facility/${FACILITY_WITHOUT_MAP}`);
        await expect(
            page.locator('iframe[title="Facility location map"]'),
        ).not.toBeVisible();
        await expect(
            page.getByText("Google Maps").locator("..").getByText("-"),
        ).toBeVisible({ timeout: 10000 });
    });
});
