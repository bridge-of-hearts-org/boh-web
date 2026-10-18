import { test, expect, Page } from "@playwright/test";

/* Server action IDs change on every build and only ship in the JS of the
   admin-only edit pages, so the test logs in to capture real action requests
   and then replays them without a session. */
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;

type CapturedAction = {
    headers: Record<string, string>;
    args: any[];
};

async function login(page: Page, callbackUrl: string) {
    await page.goto(
        `/admin/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
    );
    await page.locator("#username").fill(adminUsername!);
    await page.locator("#password").fill(adminPassword!);
    await page.getByRole("button", { name: "Login" }).click();
    await page.waitForURL((url) => url.pathname === callbackUrl);
}

/* Click Submit on the edit form and capture the server action request
   without letting it reach the server */
async function captureSubmit(page: Page): Promise<CapturedAction> {
    let resolveCapture: (action: CapturedAction) => void;
    const captured = new Promise<CapturedAction>((resolve) => {
        resolveCapture = resolve;
    });

    await page.route("**/facility/**", async (route) => {
        const request = route.request();
        const headers = request.headers();

        if (request.method() !== "POST" || !headers["next-action"]) {
            await route.continue();
            return;
        }

        /* The replay sets its own session (or none) and body length */
        delete headers["cookie"];
        delete headers["content-length"];
        resolveCapture({
            headers: headers,
            args: JSON.parse(request.postData() ?? "[]"),
        });
        await route.abort();
    });

    await page.getByRole("button", { name: "Submit" }).click();
    const action = await captured;
    await page.unroute("**/facility/**");

    return action;
}

async function getExistingSlug(page: Page): Promise<string> {
    await page.goto("/directory");
    const link = page.locator('a[href^="/facility/"]').first();
    await expect(link).toBeVisible({ timeout: 10000 });
    const href = await link.getAttribute("href");
    return href!.replace("/facility/", "");
}

test.describe("Write server actions require an admin session", () => {
    test.skip(
        !adminUsername || !adminPassword,
        "ADMIN_USERNAME and ADMIN_PASSWORD are needed to capture action IDs",
    );

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
        action.args[0].slug = existingSlug;

        const response = await request.post("/facility/new", {
            headers: action.headers,
            data: JSON.stringify(action.args),
        });
        const body = await response.text();

        expect(body).toContain("Unauthorized");
        expect(body).not.toContain("Unique constraint");
    });

    test("updateFacility rejects unauthenticated calls but accepts admin calls", async ({
        page,
        request,
    }) => {
        const existingSlug = await getExistingSlug(page);
        const editPath = `/facility/edit/${existingSlug}`;

        await login(page, editPath);
        const action = await captureSubmit(page);

        /* Point at a slug that doesn't exist: even if the guard were missing,
           no existing record would be overwritten */
        const unauthArgs = structuredClone(action.args);
        unauthArgs[0].slug = `e2e-nonexistent-${Date.now()}`;

        const unauthResponse = await request.post(editPath, {
            headers: action.headers,
            data: JSON.stringify(unauthArgs),
        });
        const unauthBody = await unauthResponse.text();

        expect(unauthBody).toContain("Unauthorized");
        expect(unauthBody).not.toContain("not found");

        /* The admin's own unchanged submission still goes through */
        const adminResponse = await page.request.post(editPath, {
            headers: action.headers,
            data: JSON.stringify(action.args),
        });
        const adminBody = await adminResponse.text();

        expect(adminBody).toContain("success");
        expect(adminBody).not.toContain("Unauthorized");
    });
});
