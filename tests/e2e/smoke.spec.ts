import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Bridge of Hearts/i);
    await expect(page.getByRole("navigation").first()).toBeVisible();
});

test("directory page loads and shows facility cards", async ({ page }) => {
    await page.goto("/directory");
    await expect(page.getByRole("heading", { name: /child development centres/i })).toBeVisible();
    // At least one facility card should be present
    const cards = page.locator('[data-testid="facility-card"], a[href^="/facility/"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
});

test("about page loads", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { name: /about/i })).toBeVisible();
});

test("contact page loads", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: /contact/i })).toBeVisible();
});
