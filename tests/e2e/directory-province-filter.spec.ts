import { test, expect } from "@playwright/test";

// Regression test for #60: the province filter must match the province exactly,
// so "Western" does not also return "North Western" facilities.
test.describe("Directory filter - Province exact match", () => {
    test("filtering by Western does not list North Western facilities", async ({
        page,
    }) => {
        await page.goto("/directory?province=Western&itemsPerPage=100");

        await expect(
            page.getByText("Western Province", { exact: true }).first(),
        ).toBeVisible();
        await expect(page.getByText("North Western Province")).toHaveCount(0);
    });
});
