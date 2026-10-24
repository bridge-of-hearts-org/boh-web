import { test, expect, devices } from "@playwright/test";

test.describe("Managed By autocomplete in directory filter", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/directory");
    });

    test("full list of organisations appears on focus without typing", async ({
        page,
    }) => {
        await page.getByLabel("Managed By").click();
        const suggestions = page.locator("#managedBy-suggestions li");
        await expect(suggestions.first()).toBeVisible({ timeout: 5000 });
        expect(await suggestions.count()).toBeGreaterThan(1);
    });

    test("suggestions contain no duplicates and no empty entries", async ({
        page,
    }) => {
        await page.getByLabel("Managed By").click();
        const suggestions = page.locator("#managedBy-suggestions li");
        await expect(suggestions.first()).toBeVisible({ timeout: 5000 });

        // textContent keeps repeated spaces that innerText would collapse
        const allOrgs = await suggestions.allTextContents();
        expect(new Set(allOrgs).size).toBe(allOrgs.length);
        for (const org of allOrgs) {
            expect(org.trim()).not.toBe("");
        }
    });

    test("typing filters organisations case-insensitively, matching anywhere", async ({
        page,
    }) => {
        const managedByInput = page.getByLabel("Managed By");
        await managedByInput.click();
        const suggestions = page.locator("#managedBy-suggestions li");
        await expect(suggestions.first()).toBeVisible({ timeout: 5000 });

        const allOrgs = await suggestions.allTextContents();

        // Find a lowercase fragment that narrows the list, preferring one from
        // the middle of a value. There are few organisations and they share
        // words, so try every start position.
        let fragment = "";
        let expected: string[] = [];
        search: for (const org of allOrgs) {
            for (let start = 1; start + 4 <= org.length; start++) {
                const candidate = org.slice(start, start + 4).toLowerCase();
                if (!/^[a-z]{4}$/.test(candidate)) {
                    continue;
                }
                const matches = allOrgs.filter((o) =>
                    o.toLowerCase().includes(candidate),
                );
                if (matches.length < allOrgs.length) {
                    fragment = candidate;
                    expected = matches;
                    break search;
                }
            }
        }
        expect(fragment).not.toBe("");

        await managedByInput.fill(fragment.toUpperCase());
        await expect(suggestions).toHaveText(expected);
    });

    test("clicking a suggestion populates the input and closes the dropdown", async ({
        page,
    }) => {
        const managedByInput = page.getByLabel("Managed By");
        await managedByInput.click();
        const suggestions = page.locator("#managedBy-suggestions li");
        await expect(suggestions.first()).toBeVisible({ timeout: 5000 });
        const suggestionText = (await suggestions.first().textContent()) ?? "";
        await suggestions.first().click();
        await expect(managedByInput).toHaveValue(suggestionText);
        await expect(page.locator("#managedBy-suggestions")).not.toBeVisible();
    });

    test("picking a suggestion and applying puts it in the URL", async ({
        page,
    }) => {
        const managedByInput = page.getByLabel("Managed By");
        await managedByInput.click();
        const suggestions = page.locator("#managedBy-suggestions li");
        await expect(suggestions.first()).toBeVisible({ timeout: 5000 });
        const suggestionText = (await suggestions.first().textContent()) ?? "";
        await suggestions.first().click();
        await expect(managedByInput).toHaveValue(suggestionText);

        await page.getByRole("button", { name: "Apply" }).click();
        await expect(page).toHaveURL(/managedBy=/);
        // Compare the decoded param, since the value may contain spaces or symbols
        await expect
            .poll(() => new URL(page.url()).searchParams.get("managedBy"))
            .toBe(suggestionText);
    });

    test("dropdown closes when the input loses focus", async ({ page }) => {
        await page.getByLabel("Managed By").click();
        const suggestions = page.locator("#managedBy-suggestions li");
        await expect(suggestions.first()).toBeVisible({ timeout: 5000 });
        // The open dropdown covers the fields below, so click the heading
        await page
            .getByRole("heading", { name: "Filters", exact: true })
            .click();
        await expect(page.locator("#managedBy-suggestions")).not.toBeVisible();
    });

    test("right-clicking a suggestion does not select it", async ({ page }) => {
        const managedByInput = page.getByLabel("Managed By");
        await managedByInput.click();
        const suggestions = page.locator("#managedBy-suggestions li");
        await expect(suggestions.first()).toBeVisible({ timeout: 5000 });
        await suggestions.first().click({ button: "right" });
        await expect(managedByInput).toHaveValue("");
        await expect(suggestions.first()).toBeVisible();
    });

    test("dropdown closes when Escape is pressed", async ({ page }) => {
        const managedByInput = page.getByLabel("Managed By");
        await managedByInput.click();
        const suggestions = page.locator("#managedBy-suggestions li");
        await expect(suggestions.first()).toBeVisible({ timeout: 5000 });
        await managedByInput.press("Escape");
        await expect(page.locator("#managedBy-suggestions")).not.toBeVisible();
        await expect(managedByInput).toBeFocused();
    });
});

test.describe("Managed By autocomplete on a touch device", () => {
    const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } =
        devices["Pixel 5"];
    test.use({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch });

    test.beforeEach(async ({ page }) => {
        await page.goto("/directory");
    });

    test("tapping outside closes the dropdown", async ({ page }) => {
        await page.getByLabel("Managed By").tap();
        const suggestions = page.locator("#managedBy-suggestions li");
        await expect(suggestions.first()).toBeVisible({ timeout: 5000 });
        await page.getByRole("heading", { name: "Filters", exact: true }).tap();
        await expect(page.locator("#managedBy-suggestions")).not.toBeVisible();
    });

    test("tapping an organisation selects it and closes the dropdown", async ({
        page,
    }) => {
        const managedByInput = page.getByLabel("Managed By");
        await managedByInput.tap();
        const suggestions = page.locator("#managedBy-suggestions li");
        await expect(suggestions.first()).toBeVisible({ timeout: 5000 });
        const suggestionText = (await suggestions.first().textContent()) ?? "";
        await suggestions.first().tap();
        await expect(managedByInput).toHaveValue(suggestionText);
        await expect(page.locator("#managedBy-suggestions")).not.toBeVisible();
    });
});
