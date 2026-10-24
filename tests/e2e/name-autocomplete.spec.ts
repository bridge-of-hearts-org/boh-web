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
        expect(await suggestions.count()).toBeGreaterThan(1);
    });

    test("typing filters names case-insensitively, matching anywhere", async ({
        page,
    }) => {
        const nameInput = page.getByLabel("Name");
        await nameInput.click();
        const suggestions = page.locator("#name-suggestions li");
        await expect(suggestions.first()).toBeVisible({ timeout: 5000 });

        // textContent keeps repeated spaces that innerText would collapse
        const allNames = await suggestions.allTextContents();

        // Find a lowercase fragment from the middle of a name that narrows the list
        let fragment = "";
        let expected: string[] = [];
        for (const name of allNames) {
            const start = Math.floor(name.length / 3);
            const candidate = name.slice(start, start + 4).toLowerCase();
            if (!/^[a-z]{4}$/.test(candidate)) {
                continue;
            }
            const matches = allNames.filter((n) =>
                n.toLowerCase().includes(candidate),
            );
            if (matches.length < allNames.length) {
                fragment = candidate;
                expected = matches;
                break;
            }
        }
        expect(fragment).not.toBe("");

        await nameInput.fill(fragment.toUpperCase());
        await expect(suggestions).toHaveText(expected);
    });

    test("clicking a suggestion populates the input and closes the dropdown", async ({
        page,
    }) => {
        const nameInput = page.getByLabel("Name");
        await nameInput.click();
        const suggestions = page.locator("#name-suggestions li");
        await expect(suggestions.first()).toBeVisible({ timeout: 5000 });
        const suggestionText = (await suggestions.first().textContent()) ?? "";
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
        // The open dropdown covers the fields below, so click the heading
        await page
            .getByRole("heading", { name: "Filters", exact: true })
            .click();
        await expect(page.locator("#name-suggestions")).not.toBeVisible();
    });

    test("dropdown closes when Escape is pressed", async ({ page }) => {
        const nameInput = page.getByLabel("Name");
        await nameInput.click();
        const suggestions = page.locator("#name-suggestions li");
        await expect(suggestions.first()).toBeVisible({ timeout: 5000 });
        await nameInput.press("Escape");
        await expect(page.locator("#name-suggestions")).not.toBeVisible();
        await expect(nameInput).toBeFocused();
    });
});
