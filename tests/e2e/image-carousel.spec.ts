import { test, expect } from "@playwright/test";

// A facility we know exists with photos
const FACILITY_SLUG = "ami-tsunami-childrens-home-dunagaha";

test.describe("ImageCarousel enlarged photo", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/facility/${FACILITY_SLUG}`);
    });

    test("clicking a photo opens the enlarged overlay", async ({ page }) => {
        const firstPhoto = page.locator(".carousel-scrollbar img").first();
        await expect(firstPhoto).toBeVisible({ timeout: 10000 });
        await firstPhoto.click();
        await expect(page.locator(".fixed.inset-0")).toBeVisible();
    });

    test("clicking outside the photo closes the overlay", async ({ page }) => {
        const firstPhoto = page.locator(".carousel-scrollbar img").first();
        await firstPhoto.click();
        const overlay = page.locator(".fixed.inset-0");
        await expect(overlay).toBeVisible();
        // Click the overlay backdrop (not the image itself)
        await overlay.click({ position: { x: 10, y: 10 } });
        await expect(overlay).not.toBeVisible();
    });

    test("pressing Esc closes the enlarged overlay", async ({ page }) => {
        const firstPhoto = page.locator(".carousel-scrollbar img").first();
        await firstPhoto.click();
        await expect(page.locator(".fixed.inset-0")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.locator(".fixed.inset-0")).not.toBeVisible();
    });

    test("X button closes the enlarged overlay", async ({ page }) => {
        const firstPhoto = page.locator(".carousel-scrollbar img").first();
        await firstPhoto.click();
        await expect(page.locator(".fixed.inset-0")).toBeVisible();
        await page.getByRole("button", { name: "Close" }).click();
        await expect(page.locator(".fixed.inset-0")).not.toBeVisible();
    });
});
