import { test, expect } from "@playwright/test";

test.describe("City autocomplete in directory filter", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/directory");
    });

    test("suggestions appear when typing in the city field", async ({
        page,
    }) => {
        const cityInput = page.getByLabel("City");
        await cityInput.fill("a");
        const suggestions = page.locator("#city-suggestions li");
        await expect(suggestions.first()).toBeVisible({ timeout: 5000 });
    });

    test("clicking a suggestion populates the input and closes the dropdown", async ({
        page,
    }) => {
        const cityInput = page.getByLabel("City");
        await cityInput.fill("a");
        const suggestions = page.locator("#city-suggestions li");
        await expect(suggestions.first()).toBeVisible({ timeout: 5000 });
        const suggestionText = await suggestions.first().innerText();
        await suggestions.first().click();
        await expect(cityInput).toHaveValue(suggestionText);
        await expect(suggestions.first()).not.toBeVisible();
    });

    test("dropdown closes when the city input loses focus", async ({ page }) => {
        const cityInput = page.getByLabel("City");
        await cityInput.fill("a");
        const suggestions = page.locator("#city-suggestions li");
        await expect(suggestions.first()).toBeVisible({ timeout: 5000 });
        await page.getByLabel("Name").click();
        await expect(suggestions.first()).not.toBeVisible();
    });
});
