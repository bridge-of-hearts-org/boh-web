import { test, expect } from "@playwright/test";

import { getExistingSlug } from "./admin-helpers";

/* No facility has Sinhala text yet, so these check the English fallback.
   A test for a facility with Sinhala text follows once one is approved. */
test.describe("Sinhala facility data", () => {
    test("a facility without Sinhala text shows its English text on the Sinhala page", async ({
        page,
    }) => {
        const slug = await getExistingSlug(page);

        await page.goto(`/facility/${slug}`);
        const englishName = await page.locator("h1").first().innerText();
        expect(englishName.trim()).not.toBe("");

        await page.goto(`/si/facility/${slug}`);
        await expect(page.locator("html")).toHaveAttribute("lang", "si");
        await expect(page.locator("h1").first()).toHaveText(englishName);
    });

    test("the Sinhala directory finds a facility by its English name", async ({
        page,
    }) => {
        const slug = await getExistingSlug(page);
        await page.goto(`/facility/${slug}`);
        /* textContent, not innerText: the search needs the stored name,
           and innerText collapses repeated spaces, which some names have */
        const englishName = (
            (await page.locator("h1").first().textContent()) ?? ""
        ).trim();

        await page.goto(
            `/si/directory?name=${encodeURIComponent(englishName)}`,
        );
        await expect(
            page.locator(`a[href="/si/facility/${slug}"]`).first(),
        ).toBeVisible({ timeout: 10000 });
    });
});
