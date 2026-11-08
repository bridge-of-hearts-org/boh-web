import { test, expect, Page } from "@playwright/test";

import { hasCredentials, login } from "./admin-helpers";

const inputFor = (page: Page, label: RegExp) =>
    page.locator("label").filter({ hasText: label }).locator("+ input");

const deleteButton = (page: Page) =>
    page.getByRole("button", { name: "Delete Facility" });

/* Traces record request bodies and cookies, which here include the admin
   password and session, and would end up in the uploaded report */
test.use({ trace: "off" });

/* Admin form tests: need admin credentials. The test adds a facility of its
   own and deletes it, so no existing record is touched */
test.describe("Deleting a facility", () => {
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

    test("the add page has no delete button", async ({ page }) => {
        await login(page, "/facility/new");

        await expect(
            page.getByRole("button", { name: "Submit" }),
        ).toBeVisible();
        await expect(deleteButton(page)).toHaveCount(0);
    });

    test("an admin deletes a facility after confirming", async ({ page }) => {
        const stamp = Date.now();
        const slug = `e2e-delete-${stamp}`;
        const name = `E2E delete test ${stamp}`;
        const editPath = `/facility/edit/${slug}`;

        /* Add the facility to delete */
        await login(page, "/facility/new");
        await inputFor(page, /^Database Slug$/).fill(slug);
        await inputFor(page, /^Name$/).fill(name);
        page.once("dialog", (dialog) => {
            expect(dialog.message()).toBe("success");
            dialog.accept();
        });
        await page.getByRole("button", { name: "Submit" }).click();
        await expect(page).toHaveURL((url) => url.pathname === "/admin");

        await page.goto(editPath);
        await expect(inputFor(page, /^Name$/)).toHaveValue(name);

        /* Cancelling the confirmation keeps the facility */
        const cancelled = page.waitForEvent("dialog");
        await deleteButton(page).click();
        const confirmDialog = await cancelled;
        expect(confirmDialog.type()).toBe("confirm");
        expect(confirmDialog.message()).toContain(name);
        await confirmDialog.dismiss();
        await page.waitForLoadState("networkidle");

        await expect(page).toHaveURL((url) => url.pathname === editPath);
        await page.goto(`/facility/${slug}`);
        await expect(page.getByRole("heading", { name: name })).toBeVisible();

        /* Confirming deletes it and returns to the dashboard */
        await page.goto(editPath);
        await expect(inputFor(page, /^Name$/)).toHaveValue(name);
        const messages: string[] = [];
        page.on("dialog", (dialog) => {
            messages.push(dialog.message());
            dialog.accept();
        });
        await deleteButton(page).click();
        await expect(page).toHaveURL((url) => url.pathname === "/admin");
        expect(messages).toEqual([
            expect.stringContaining(name),
            `Deleted "${name}"`,
        ]);

        await expect(page.getByRole("link", { name: name })).toHaveCount(0);
        await page.goto(`/facility/${slug}`);
        await expect(
            page.getByRole("heading", { name: "Page Not Found" }),
        ).toBeVisible();
    });
});
