import { test, expect, Page } from "@playwright/test";

import { getExistingSlug, hasCredentials, login } from "./admin-helpers";

/* Traces record request bodies and cookies, which here include the admin
   password and session, and would end up in the uploaded report */
test.use({ trace: "off" });

const mobileViewport = { width: 390, height: 844 };
const tabletViewport = { width: 768, height: 1024 };
const smallLaptopViewport = { width: 1024, height: 768 };
const laptopViewport = { width: 1366, height: 768 };

const headerAdminLink = (page: Page) =>
    page.locator("#header").getByRole("link", { name: "Admin", exact: true });

const hamburgerButton = (page: Page) =>
    page.locator('#header button[name="Menu"]');

const hamburgerItems = (page: Page) => page.getByTestId("hamburger-menu-items");

const editLink = (page: Page) =>
    page.getByRole("link", { name: "Edit", exact: true });

// Public visitors: no credentials needed
test.describe("Admin-only navigation for public visitors", () => {
    test("mobile menu has no Admin item", async ({ page }) => {
        await page.setViewportSize(mobileViewport);
        await page.goto("/");

        await hamburgerButton(page).click();
        await expect(hamburgerItems(page)).toBeVisible();
        await expect(hamburgerItems(page).getByText("Directory")).toBeVisible();
        await expect(
            hamburgerItems(page).getByText("Admin", { exact: true }),
        ).toHaveCount(0);
        await expect(headerAdminLink(page)).toHaveCount(0);
    });

    test("facility page has no Edit button", async ({ page }) => {
        const slug = await getExistingSlug(page);
        await page.goto(`/facility/${slug}`);

        await expect(page.locator("h1").first()).toBeVisible();
        await expect(editLink(page)).toHaveCount(0);
        await expect(
            page.locator(`a[href="/facility/edit/${slug}"]`),
        ).toHaveCount(0);
    });
});

// Admin tests: need admin credentials. Nothing is saved.
test.describe("Admin-only navigation for admins", () => {
    /* Locally the tests are optional, but in CI missing credentials must fail
       rather than skip, or they would silently never run */
    test.skip(
        !hasCredentials && !process.env.CI,
        "Set ADMIN_USERNAME and ADMIN_PASSWORD to run admin tests",
    );

    test.beforeEach(() => {
        expect(
            hasCredentials,
            "ADMIN_USERNAME and ADMIN_PASSWORD must be set in CI",
        ).toBe(true);
    });

    test("on mobile, Admin moves from the header into the hamburger menu", async ({
        page,
    }) => {
        await page.setViewportSize(mobileViewport);
        await login(page, "/directory");

        await expect(headerAdminLink(page)).toBeHidden();

        await hamburgerButton(page).click();
        const adminItem = hamburgerItems(page).getByText("Admin", {
            exact: true,
        });
        await expect(adminItem).toBeVisible();
        await expect(
            hamburgerItems(page).locator(":scope > div").first(),
        ).toHaveText("Admin");

        await adminItem.click();
        await expect(page).toHaveURL((url) => url.pathname === "/admin");
        await expect(hamburgerItems(page)).toHaveCount(0);
    });

    test("on a tablet, Admin is in the hamburger menu", async ({ page }) => {
        await page.setViewportSize(tabletViewport);
        await login(page, "/about");

        await expect(headerAdminLink(page)).toBeHidden();

        await hamburgerButton(page).click();
        await expect(
            hamburgerItems(page).getByText("Admin", { exact: true }),
        ).toBeVisible();
    });

    for (const path of ["/about", "/si/about"]) {
        test(`on a small laptop, the header with the Admin button fits the screen (${path})`, async ({
            page,
        }) => {
            await page.setViewportSize(smallLaptopViewport);
            await login(page, path);

            await expect(headerAdminLink(page)).toBeVisible();
            await expect(page.getByTestId("language-toggle")).toBeVisible();
            const scrollWidth = await page.evaluate(
                () => document.documentElement.scrollWidth,
            );
            expect(scrollWidth).toBeLessThanOrEqual(smallLaptopViewport.width);
        });
    }

    test("on laptop, Admin stays in the header", async ({ page }) => {
        await page.setViewportSize(laptopViewport);
        await login(page, "/directory");

        await expect(headerAdminLink(page)).toBeVisible();
        await expect(headerAdminLink(page)).toHaveAttribute("href", "/admin");
        await expect(hamburgerButton(page)).toBeHidden();

        await headerAdminLink(page).click();
        await expect(page).toHaveURL((url) => url.pathname === "/admin");
    });

    for (const [size, viewport] of [
        ["mobile", mobileViewport],
        ["laptop", laptopViewport],
    ] as const) {
        test(`facility page shows an Edit button to admins on ${size}`, async ({
            page,
        }) => {
            await page.setViewportSize(viewport);
            const slug = await getExistingSlug(page);
            await login(page, `/facility/${slug}`);

            await expect(editLink(page)).toBeVisible();
            await expect(editLink(page)).toHaveAttribute(
                "href",
                `/facility/edit/${slug}`,
            );

            // Fits within the screen without horizontal scrolling
            const box = await editLink(page).boundingBox();
            expect(box).not.toBeNull();
            expect(box!.x).toBeGreaterThanOrEqual(0);
            expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);

            await editLink(page).click();
            await expect(page).toHaveURL(
                (url) => url.pathname === `/facility/edit/${slug}`,
            );
        });
    }
});
