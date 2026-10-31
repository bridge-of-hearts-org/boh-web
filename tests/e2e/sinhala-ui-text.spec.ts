import { test, expect } from "@playwright/test";

import { getExistingSlug } from "./admin-helpers";

const laptopViewport = { width: 1366, height: 768 };

test.describe("Sinhala UI text", () => {
    test("page text is in Sinhala, with the menu kept in English", async ({
        page,
    }) => {
        await page.setViewportSize(laptopViewport);
        await page.goto("/si/about");

        const nav = page.locator("#header nav");
        await expect(
            nav.getByRole("link", { name: "Directory" }),
        ).toBeVisible();
        await expect(
            page.getByRole("heading", { name: "අපගේ තොරතුරු" }),
        ).toBeVisible();
        await expect(
            page.getByText("මෙම වෙබ් අඩවියේ ඇති සමහර රූප", { exact: false }),
        ).toBeVisible();
    });

    test("directory filters show Sinhala labels and province names", async ({
        page,
    }) => {
        await page.setViewportSize(laptopViewport);
        await page.goto("/si/directory");

        await expect(
            page.getByRole("heading", { name: "ළමා සංවර්ධන මධ්‍යස්ථාන" }),
        ).toBeVisible();
        await expect(page.getByText("සෙවුම් නිර්ණායක")).toBeVisible();

        /* The option shows the Sinhala name but keeps the English value
           used in the URL */
        const province = page.locator("select#province");
        await expect(province.locator('option[value="Central"]')).toHaveText(
            "මධ්‍යම පළාත",
        );

        /* Sorting by name is left out on Sinhala pages. The facility list
           streams in after the filters, so wait for it before checking. */
        await expect(page.locator("select#itemsPerPage")).toBeVisible();
        await expect(page.locator("select#sortBy")).toHaveCount(0);
    });

    test("Sinhala pages ignore a sort carried over from an English link", async ({
        page,
    }) => {
        const facilityOrder = async (path: string) => {
            await page.goto(path);
            const links = page.locator('a[href^="/si/facility/"]');
            await expect(links.first()).toBeVisible({ timeout: 10000 });
            const hrefs = await links.evaluateAll((elements) =>
                elements.map((e) => e.getAttribute("href")),
            );
            return [...new Set(hrefs)];
        };

        const defaultOrder = await facilityOrder("/si/directory");
        const withCitySort = await facilityOrder("/si/directory?sortBy=city");

        expect(withCitySort).toEqual(defaultOrder);
    });

    test("English pages keep their English text", async ({ page }) => {
        await page.setViewportSize(laptopViewport);
        await page.goto("/directory");

        await expect(
            page.getByRole("heading", { name: "Child Development Centres" }),
        ).toBeVisible();
        await expect(
            page.locator("select#province").locator('option[value="Central"]'),
        ).toHaveText("Central");
        await expect(page.locator("select#sortBy")).toBeVisible();
    });

    test("facility page labels are in Sinhala", async ({ page }) => {
        const slug = await getExistingSlug(page);
        await page.goto(`/si/facility/${slug}`);

        await expect(
            page.getByRole("heading", { name: "ස්ථානය" }),
        ).toBeVisible();
        await expect(page.getByText("ලිපිනය", { exact: true })).toBeVisible();
        await expect(
            page.getByRole("heading", { name: "සම්බන්ධතා" }),
        ).toBeVisible();
    });
});
