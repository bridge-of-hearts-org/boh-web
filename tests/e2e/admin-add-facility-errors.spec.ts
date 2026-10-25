import { test, expect, Page } from "@playwright/test";

import { getExistingSlug, hasCredentials, login } from "./admin-helpers";

const inputFor = (page: Page, label: RegExp) =>
    page.locator("label").filter({ hasText: label }).locator("+ input");

/* Traces record request bodies and cookies, which here include the admin
   password and session, and would end up in the uploaded report */
test.use({ trace: "off" });

/* Admin form tests: need admin credentials. Nothing is saved, since the slug
   is taken. This relies on the unique index on `slug` existing in the
   database under test (e.g. the Vercel preview's), or the add would succeed */
test.describe("Adding a facility that fails to save", () => {
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

    test("a duplicate slug keeps the admin on the form with a clear message", async ({
        page,
    }) => {
        const slug = await getExistingSlug(page);
        /* A unique name, so the slug is the only constraint that fails */
        const name = `Duplicate slug test ${Date.now()}`;

        await login(page, "/facility/new");
        await inputFor(page, /^Database Slug$/).fill(slug);
        await inputFor(page, /^Name$/).fill(name);

        const dialog = page.waitForEvent("dialog");
        await page.getByRole("button", { name: "Submit" }).click();
        const alert = await dialog;
        expect(
            alert.message(),
            "The add succeeded, so a duplicate facility may have been inserted",
        ).not.toBe("success");
        expect(alert.message()).toBe(
            "A facility with this slug already exists",
        );
        await alert.accept();

        /* A redirect would follow the alert, so give it the chance to happen */
        await page.waitForLoadState("networkidle");

        await expect(page).toHaveURL((url) => url.pathname === "/facility/new");
        await expect(inputFor(page, /^Database Slug$/)).toHaveValue(slug);
        await expect(inputFor(page, /^Name$/)).toHaveValue(name);
    });
});
