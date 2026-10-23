import { test, expect, APIRequestContext, Page } from "@playwright/test";

/* Server action IDs change on every build and only ship in the JS of the
   admin-only edit pages, so the test logs in to capture real action requests
   and then replays them with and without a session. */
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
const hasCredentials = !!adminUsername && !!adminPassword;

type CapturedAction = {
    headers: Record<string, string>;
    args: any[];
};

/* Log in through the NextAuth API rather than the form, so the password is
   never typed into a field and recorded in the test report */
async function login(page: Page, path: string) {
    const csrfResponse = await page.request.get("/api/auth/csrf");
    const { csrfToken } = await csrfResponse.json();

    const loginResponse = await page.request.post(
        "/api/auth/callback/credentials",
        {
            form: {
                csrfToken: csrfToken,
                username: adminUsername!,
                password: adminPassword!,
                json: "true",
            },
            maxRedirects: 0,
        },
    );
    expect(loginResponse.ok()).toBe(true);

    const session = await (await page.request.get("/api/auth/session")).json();
    expect(session?.user?.role).toBe("admin");

    await page.goto(path);
    await expect(page).toHaveURL((url) => url.pathname === path);
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

/* Replay a captured action with new arguments and return the action's
   response body after checking it is a real server action response */
async function replayAction(
    context: APIRequestContext,
    path: string,
    action: CapturedAction,
    args: any[],
): Promise<string> {
    const response = await context.post(path, {
        headers: action.headers,
        data: JSON.stringify(args),
    });

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/x-component");

    return response.text();
}

async function getExistingSlug(page: Page): Promise<string> {
    await page.goto("/directory");
    const link = page.locator('a[href^="/facility/"]').first();
    await expect(link).toBeVisible({ timeout: 10000 });
    const href = await link.getAttribute("href");
    return href!.replace("/facility/", "");
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
        expect(body).not.toContain("Unique constraint");
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
        expect(unauthBody).not.toContain("not found");

        /* With the admin session, the call passes the guard and reaches the
           database, which reports the missing record */
        const adminBody = await replayAction(
            page.request,
            editPath,
            action,
            args,
        );

        expect(adminBody).not.toContain("Unauthorized");
        expect(adminBody).toContain("not found");
    });
});
