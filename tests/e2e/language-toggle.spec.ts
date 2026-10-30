import { test, expect, Page } from "@playwright/test";

const mobileViewport = { width: 390, height: 844 };
const laptopViewport = { width: 1366, height: 768 };

const headerToggle = (page: Page) =>
    page.locator("#header nav").getByTestId("language-toggle");

const hamburgerButton = (page: Page) =>
    page.locator('#header button[name="Menu"]');

const hamburgerItems = (page: Page) => page.getByTestId("hamburger-menu-items");

test.describe("Language toggle", () => {
    test("switches the directory to Sinhala and back, keeping the filters", async ({
        page,
    }) => {
        await page.setViewportSize(laptopViewport);
        const search = "?province=Central&sortBy=name&page=1&itemsPerPage=10";
        await page.goto(`/directory${search}`);
        await expect(page.locator("html")).toHaveAttribute("lang", "en");

        await expect(headerToggle(page)).toHaveText("සිංහල");
        await expect(
            page
                .locator("#header nav")
                .getByTestId("language-toggle-separator"),
        ).toBeVisible();
        await headerToggle(page).click();
        await expect(page).toHaveURL(
            (url) =>
                url.pathname === "/si/directory" &&
                url.searchParams.get("province") === "Central" &&
                url.searchParams.get("itemsPerPage") === "10",
        );
        await expect(page.locator("html")).toHaveAttribute("lang", "si");

        await expect(headerToggle(page)).toHaveText("English");
        await headerToggle(page).click();
        await expect(page).toHaveURL(
            (url) =>
                url.pathname === "/directory" &&
                url.searchParams.get("province") === "Central",
        );
        await expect(page.locator("html")).toHaveAttribute("lang", "en");
    });

    test("is in the hamburger menu on mobile", async ({ page }) => {
        await page.setViewportSize(mobileViewport);
        await page.goto("/about");

        await expect(headerToggle(page)).toBeHidden();
        await hamburgerButton(page).click();
        await expect(
            hamburgerItems(page).getByTestId("language-toggle-separator"),
        ).toBeVisible();
        await hamburgerItems(page).getByTestId("language-toggle").click();

        await expect(page).toHaveURL((url) => url.pathname === "/si/about");
        await expect(hamburgerItems(page)).toHaveCount(0);
    });

    test("is hidden on the English-only admin pages", async ({ page }) => {
        await page.setViewportSize(laptopViewport);
        await page.goto("/admin/login");

        await expect(page.locator("#header")).toBeVisible();
        await expect(page.getByTestId("language-toggle")).toHaveCount(0);
        await expect(page.getByTestId("language-toggle-separator")).toHaveCount(
            0,
        );
    });

    test("menu links stay in Sinhala", async ({ page }) => {
        await page.setViewportSize(laptopViewport);
        await page.goto("/si/about");

        await page
            .locator("#header nav")
            .getByRole("link", { name: "Contact" })
            .click();
        await expect(page).toHaveURL((url) => url.pathname === "/si/contact");
    });
});

test.describe("Locale routing", () => {
    test("drops the /en prefix", async ({ page }) => {
        await page.goto("/en/about");
        await expect(page).toHaveURL((url) => url.pathname === "/about");
    });

    test("sends Sinhala admin URLs to the English admin pages", async ({
        page,
    }) => {
        await page.goto("/si/admin");
        await expect(page).toHaveURL((url) =>
            url.pathname.startsWith("/admin"),
        );
    });

    test("returns 404 for unknown Sinhala pages", async ({ page }) => {
        const response = await page.goto("/si/no-such-page");
        expect(response?.status()).toBe(404);
        await expect(page.locator("html")).toHaveAttribute("lang", "si");
    });

    test("lists Sinhala pages in the sitemap", async ({ request }) => {
        const response = await request.get("/sitemap.xml");
        const sitemap = await response.text();

        expect(sitemap).toContain("https://bridgeofhearts.lk/si/directory");
        expect(sitemap).toContain('hreflang="si"');
    });
});
