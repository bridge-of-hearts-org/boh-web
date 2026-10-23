import { test, expect } from "@playwright/test";

test.describe("Name autocomplete in directory filter", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/directory");
    });

    test("full list of names appears on focus without typing", async ({
        page,
    }) => {
        await page.getByLabel("Name").click();
        const suggestions = page.locator("#name-suggestions li");
        await expect(suggestions.first()).toBeVisible({ timeout: 5000 });
    });

    test("typing filters names case-insensitively, matching anywhere", async ({
        page,
    }) => {
        const nameInput = page.getByLabel("Name");
        await nameInput.click();
        const suggestions = page.locator("#name-suggestions li");
        await expect(suggestions.first()).toBeVisible({ timeout: 5000 });
        const allCount = await suggestions.count();

        // Take a substring from the middle of a name and flip its case
        const firstName = await suggestions.first().innerText();
        const start = Math.floor(firstName.length / 3);
        const fragment = firstName.slice(start, start + 4);
        const query =
            fragment.toUpperCase() === fragment
                ? fragment.toLowerCase()
                : fragment.toUpperCase();

        await nameInput.fill(query);
        await expect(
            suggestions.filter({ hasText: firstName }).first(),
        ).toBeVisible();

        const filtered = await suggestions.allInnerTexts();
        expect(filtered.length).toBeLessThanOrEqual(allCount);
        for (const name of filtered) {
            expect(name.toLowerCase()).toContain(query.toLowerCase());
        }
    });

    test("clicking a suggestion populates the input and closes the dropdown", async ({
        page,
    }) => {
        const nameInput = page.getByLabel("Name");
        await nameInput.click();
        const suggestions = page.locator("#name-suggestions li");
        await expect(suggestions.first()).toBeVisible({ timeout: 5000 });
        const suggestionText = await suggestions.first().innerText();
        await suggestions.first().click();
        await expect(nameInput).toHaveValue(suggestionText);
        await expect(page.locator("#name-suggestions")).not.toBeVisible();
    });

    test("dropdown closes when the name input loses focus", async ({
        page,
    }) => {
        await page.getByLabel("Name").click();
        const suggestions = page.locator("#name-suggestions li");
        await expect(suggestions.first()).toBeVisible({ timeout: 5000 });
        await page.getByLabel("Managed By").click();
        await expect(page.locator("#name-suggestions")).not.toBeVisible();
    });
});
