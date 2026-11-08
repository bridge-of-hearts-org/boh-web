import { test, expect, Page } from "@playwright/test";

import { getExistingSlug, hasCredentials, login } from "./admin-helpers";

const inputFor = (page: Page, label: RegExp) =>
    page.locator("label").filter({ hasText: label }).locator("+ input");

const deleteButton = (page: Page) =>
    page.getByRole("button", { name: "Delete Facility" });

/* A server action response as the client reads it: row 0 points the action
   result at row 1. The client doesn't check the build id ("b"). */
const mockedActionResponse = (result: unknown) =>
    `0:{"a":"$@1","f":"","b":"e2e-mock"}\n1:${JSON.stringify(result)}\n`;

/* Answer every server action call with `result` without sending it to the
   server, and record its arguments. Nothing gets through, so these tests
   can't delete or change a facility, even when the suite runs against
   production after a release */
async function mockServerActions(page: Page, result: string) {
    const calls: any[][] = [];

    await page.route("**/*", async (route) => {
        const request = route.request();

        if (request.method() !== "POST" || !request.headers()["next-action"]) {
            await route.fallback();
            return;
        }

        let args: any[] = [];
        try {
            args = JSON.parse(request.postData() ?? "");
        } catch {}
        calls.push(args);

        await route.fulfill({
            status: 200,
            contentType: "text/x-component",
            body: mockedActionResponse(result),
        });
    });

    return calls;
}

/* Accept every dialog, recording its type and message, so a failed
   assertion can't leave a dialog open and hang the test */
function recordDialogs(page: Page, answer: "accept" | "dismiss") {
    const dialogs: { type: string; message: string }[] = [];

    page.on("dialog", async (dialog) => {
        dialogs.push({ type: dialog.type(), message: dialog.message() });
        if (answer === "dismiss" && dialog.type() === "confirm") {
            await dialog.dismiss();
        } else {
            await dialog.accept();
        }
    });

    return dialogs;
}

/* Traces record request bodies and cookies, which here include the admin
   password and session, and would end up in the uploaded report */
test.use({ trace: "off" });

/* Admin form tests: need admin credentials. Every server action is mocked,
   so nothing is deleted. write-actions-auth.spec.ts covers the real action */
test.describe("Deleting a facility from the edit page", () => {
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

    /* Opens a facility's edit page with every server action mocked, and
       returns its slug and saved name */
    async function openEditPage(page: Page, result: string) {
        const slug = await getExistingSlug(page);
        await login(page, `/facility/edit/${slug}`);
        const name = await inputFor(page, /^Name$/).inputValue();
        expect(name).not.toBe("");
        const calls = await mockServerActions(page, result);

        return { slug, name, calls };
    }

    test("the add page has no delete button", async ({ page }) => {
        await login(page, "/facility/new");

        await expect(
            page.getByRole("button", { name: "Submit" }),
        ).toBeVisible();
        await expect(deleteButton(page)).toHaveCount(0);
    });

    test("cancelling the confirmation deletes nothing", async ({ page }) => {
        const { slug, name, calls } = await openEditPage(page, "success");
        const dialogs = recordDialogs(page, "dismiss");

        await deleteButton(page).click();
        await expect.poll(() => dialogs.length).toBe(1);
        expect(dialogs[0].type).toBe("confirm");
        expect(dialogs[0].message).toContain(name);

        /* A delete or redirect would follow, so give it the chance to happen */
        await page.waitForLoadState("networkidle");
        expect(calls).toEqual([]);
        expect(dialogs).toHaveLength(1);
        await expect(page).toHaveURL(
            (url) => url.pathname === `/facility/edit/${slug}`,
        );
    });

    test("confirming deletes the facility and returns to the dashboard", async ({
        page,
    }) => {
        const { slug, name, calls } = await openEditPage(page, "success");
        const dialogs = recordDialogs(page, "accept");

        await deleteButton(page).click();

        await expect(page).toHaveURL((url) => url.pathname === "/admin");
        await expect(
            page.getByRole("heading", { name: "Admin Dashboard" }),
        ).toBeVisible();
        expect(calls).toEqual([[slug]]);
        expect(dialogs).toEqual([
            { type: "confirm", message: expect.stringContaining(name) },
            { type: "alert", message: `Deleted "${name}"` },
        ]);
    });

    test("a failed delete keeps the admin on the edit page", async ({
        page,
    }) => {
        const { slug, calls } = await openEditPage(
            page,
            "This facility no longer exists",
        );
        const dialogs = recordDialogs(page, "accept");

        await deleteButton(page).click();
        await expect.poll(() => dialogs.length).toBe(2);
        expect(dialogs[1]).toEqual({
            type: "alert",
            message: "This facility no longer exists",
        });

        await page.waitForLoadState("networkidle");
        expect(calls).toEqual([[slug]]);
        await expect(page).toHaveURL(
            (url) => url.pathname === `/facility/edit/${slug}`,
        );
        await expect(deleteButton(page)).toBeEnabled();
    });
});
