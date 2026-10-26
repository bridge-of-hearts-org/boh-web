import { test, expect } from "@playwright/test";

// Regression test for #61: an invalid page number in the URL must show the first
// page of results instead of an empty list.
test.describe("Directory - invalid page number", () => {
    for (const pageParam of ["abc", "0", "-1"]) {
        test(`page=${pageParam} shows the first page`, async ({ page }) => {
            await page.goto(`/directory?page=${pageParam}`);

            await expect(page.getByText("Showing 1 - 10 of")).toBeVisible();
            await expect(page.locator('a[href^="/facility/"] h2')).toHaveCount(
                10,
            );

            /* The pagination treats the invalid page as page 1, so "next" goes to page 2 */
            await page
                .locator('button[name="Go to next page"]')
                .first()
                .click();
            await expect(page).toHaveURL(/[?&]page=2(&|$)/);
            await expect(page.getByText("Showing 11 - 20 of")).toBeVisible();
        });
    }

    for (const pageParam of ["9999", "1e20"]) {
        test(`page=${pageParam} past the end shows the last page`, async ({
            page,
        }) => {
            await page.goto(`/directory?page=${pageParam}`);

            await expect(page.getByText(/Showing \d+ - \d+ of/)).toBeVisible();
            await expect(
                page.locator('a[href^="/facility/"] h2').first(),
            ).toBeVisible();

            /* On the last page there is a "previous" button but no "next" one */
            await expect(
                page.locator('button[name="Go to next page"]'),
            ).toHaveCount(0);
            await expect(
                page.locator('button[name="Go to the previous page"]').first(),
            ).toBeVisible();
        });
    }
});
