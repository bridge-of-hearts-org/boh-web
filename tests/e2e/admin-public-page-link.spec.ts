import { test, expect, Page } from "@playwright/test";

import { getExistingSlug, hasCredentials, login } from "./admin-helpers";

/* Traces record request bodies and cookies, which here include the admin
   password and session, and would end up in the uploaded report */
test.use({ trace: "off" });

// Admin form tests: need admin credentials. Nothing is saved.
test.describe("Link to the public facility page from the admin form", () => {
    /* Locally the tests are optional, but in CI missing credentials must fail
       rather than skip, or they would silently never run */
    test.skip(
        !hasCredentials && !process.env.CI,
        "Set ADMIN_USERNAME and ADMIN_PASSWORD to run admin form tests",
    );

    test.beforeEach(() => {
        expect(
            hasCredentials,
            "ADMIN_USERNAME and ADMIN_PASSWORD must be set in CI",
        ).toBe(true);
    });

    const publicPageLink = (page: Page) =>
        page.getByRole("link", { name: "View Public Page" });

    test("edit page opens the saved facility's public page in a new tab", async ({
        page,
    }) => {
        const slug = await getExistingSlug(page);
        await login(page, `/facility/edit/${slug}`);

        await expect(publicPageLink(page)).toHaveAttribute(
            "href",
            `/facility/${slug}`,
        );
        await expect(publicPageLink(page)).toHaveAttribute("target", "_blank");

        const [publicPage] = await Promise.all([
            page.context().waitForEvent("page"),
            publicPageLink(page).click(),
        ]);
        await expect(publicPage).toHaveURL(
            (url) => url.pathname === `/facility/${slug}`,
        );

        // Clicking it doesn't submit the form
        await expect(page).toHaveURL(
            (url) => url.pathname === `/facility/edit/${slug}`,
        );
    });

    test("add page has no public page link", async ({ page }) => {
        await login(page, "/facility/new");

        await expect(
            page.getByRole("button", { name: "Submit" }),
        ).toBeVisible();
        await expect(publicPageLink(page)).toHaveCount(0);
    });
});
