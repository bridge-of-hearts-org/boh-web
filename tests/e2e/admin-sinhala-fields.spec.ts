import { test, expect } from "@playwright/test";

import {
    captureAction,
    getExistingSlug,
    hasCredentials,
    login,
} from "./admin-helpers";

/* Traces record request bodies and cookies, which here include the admin
   password and session, and would end up in the uploaded report */
test.use({ trace: "off" });

// Needs admin credentials. Nothing is saved.
test.describe("Sinhala fields in the admin form", () => {
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

    test("sends the Sinhala values with the facility", async ({ page }) => {
        await login(page, "/facility/new");

        await page
            .locator('label:has-text("Database Slug") + input')
            .fill("e2e-sinhala-check");
        await page.locator('label:text-is("Name") + input').fill("E2E Check");

        /* The English value shows while the Sinhala input is empty */
        await expect(page.getByLabel("Name (Sinhala)")).toHaveAttribute(
            "placeholder",
            "E2E Check",
        );

        await page.getByLabel("Name (Sinhala)").fill("පරීක්ෂණය");
        await page.getByLabel("City (Sinhala)").fill("මහනුවර");

        /* The request is captured and aborted, so nothing is saved */
        page.on("dialog", (dialog) => dialog.dismiss());
        const action = await captureAction(page, () =>
            page.getByRole("button", { name: "Submit" }).click(),
        );

        expect(action.args[0].translations.si).toMatchObject({
            name: "පරීක්ෂණය",
            city: "මහනුවර",
        });
    });

    test("the edit page has a Sinhala input for each translated field", async ({
        page,
    }) => {
        const slug = await getExistingSlug(page);
        await login(page, `/facility/edit/${slug}`);

        for (const label of [
            "Name",
            "Managed By",
            "Description",
            "Address",
            "City",
        ]) {
            await expect(page.getByLabel(`${label} (Sinhala)`)).toBeVisible();
        }

        const englishName = await page
            .locator('label:text-is("Name") + input')
            .inputValue();
        await expect(page.getByLabel("Name (Sinhala)")).toHaveAttribute(
            "placeholder",
            englishName,
        );
    });
});
