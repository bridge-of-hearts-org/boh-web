import { test, expect } from "@playwright/test";

// Regression test for #61: an invalid page number in the URL must show the first
// page of results instead of an empty list.
const facilityNames = 'a[href^="/facility/"] h2';

test.describe("Directory - invalid page number", () => {
    for (const pageParam of ["abc", "0", "-1"]) {
        test(`page=${pageParam} shows the first page`, async ({ page }) => {
            await page.goto("/directory");
            const firstPageNames = await page
                .locator(facilityNames)
                .allTextContents();
            expect(firstPageNames.length).toBeGreaterThan(0);

            await page.goto(`/directory?page=${pageParam}`);

            await expect(page.getByText("Showing 1 -")).toBeVisible();
            expect(await page.locator(facilityNames).allTextContents()).toEqual(
                firstPageNames,
            );
        });
    }
});
