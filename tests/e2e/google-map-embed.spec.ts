import { test, expect } from "@playwright/test";

// A facility known to have a Google Maps link in the database
const FACILITY_WITH_MAP = "memon-charitable-foundation-childrens-home-kaleliya";

// A facility known to have no Google Maps link
const FACILITY_WITHOUT_MAP = "mawupiya-sewana-childrens-home-gonapola";

// A facility whose name also matches an unrelated place abroad, with stored coordinates
const FACILITY_WITH_AMBIGUOUS_NAME = "st-leonards-childrens-home-gampola";

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

    test("centres the map on the stored coordinates rather than a name search", async ({
        page,
    }) => {
        await page.goto(`/facility/${FACILITY_WITH_AMBIGUOUS_NAME}`);
        const mapIframe = page.locator('iframe[title="Facility location map"]');
        await expect(mapIframe).toBeVisible({ timeout: 10000 });

        const src = new URL((await mapIframe.getAttribute("src")) ?? "");
        expect(src.searchParams.get("q")).toBe("7.1654797,80.5736322");
    });
});
