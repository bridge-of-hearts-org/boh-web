import { test, expect, Page } from "@playwright/test";

import {
    captureAction,
    CapturedAction,
    getExistingSlug,
    hasCredentials,
    login,
    replayAction,
} from "./admin-helpers";

/* Click Submit on the edit form and capture the server action request
   without letting it reach the server */
async function captureSubmit(page: Page): Promise<CapturedAction> {
    return captureAction(page, () =>
        page.getByRole("button", { name: "Submit" }).click(),
    );
}

/* Traces record request bodies and cookies, which here include the admin
   password and session, and would end up in the uploaded report */
test.use({ trace: "off" });

test.describe("Write server actions require an admin session", () => {
    /* Locally the test is optional, but in CI missing credentials must fail
       rather than skip, or the check would silently never run */
    test.skip(
        !hasCredentials && !process.env.CI,
        "ADMIN_USERNAME and ADMIN_PASSWORD are needed to capture action IDs",
    );

    test.beforeEach(() => {
        expect(
            hasCredentials,
            "ADMIN_USERNAME and ADMIN_PASSWORD must be set in CI",
        ).toBe(true);
    });

    test("addFacility rejects unauthenticated calls", async ({
        page,
        request,
    }) => {
        const existingSlug = await getExistingSlug(page);

        await login(page, "/facility/new");
        await page
            .locator('label:has-text("Database Slug") + input')
            .fill("e2e-auth-check");
        await page.locator('label:text-is("Name") + input').fill("E2E Check");
        const action = await captureSubmit(page);

        /* Reuse an existing slug: even if the guard were missing, the unique
           constraint would stop the record from being created */
        const args = structuredClone(action.args);
        args[0].slug = existingSlug;

        const body = await replayAction(request, "/facility/new", action, args);

        expect(body).toContain("Unauthorized");
        expect(body).not.toContain("already exists");
    });

    test("updateFacility rejects unauthenticated calls but lets admins through", async ({
        page,
        request,
    }) => {
        const existingSlug = await getExistingSlug(page);
        const editPath = `/facility/edit/${existingSlug}`;

        await login(page, editPath);
        const action = await captureSubmit(page);

        /* Point both replays at a slug that doesn't exist, so no record is
           ever written, whether or not the guard works */
        const args = structuredClone(action.args);
        args[0].slug = `e2e-nonexistent-${Date.now()}`;

        const unauthBody = await replayAction(request, editPath, action, args);

        expect(unauthBody).toContain("Unauthorized");
        expect(unauthBody).not.toContain("no longer exists");

        /* With the admin session, the call passes the guard and reaches the
           database, which reports the missing record */
        const adminBody = await replayAction(
            page.request,
            editPath,
            action,
            args,
        );

        expect(adminBody).not.toContain("Unauthorized");
        expect(adminBody).toContain("no longer exists");
    });
});
