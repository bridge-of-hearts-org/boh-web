import { expect, APIRequestContext, Page } from "@playwright/test";

/* Shared helpers for tests that need an admin session or exercise server
   actions directly. Server action IDs change on every build and only ship in
   the JS of the admin-only pages, so tests log in to capture real action
   requests and then replay them with and without a session. */

export const adminUsername = process.env.ADMIN_USERNAME;
export const adminPassword = process.env.ADMIN_PASSWORD;
export const hasCredentials = !!adminUsername && !!adminPassword;

/* The slug of a facility that exists, taken from the first directory card */
export async function getExistingSlug(page: Page): Promise<string> {
    await page.goto("/directory");
    const link = page.locator('a[href^="/facility/"]').first();
    await expect(link).toBeVisible({ timeout: 10000 });
    const href = await link.getAttribute("href");
    return href!.replace("/facility/", "");
}

export type CapturedAction = {
    headers: Record<string, string>;
    args: any[];
};

/* Log in through the NextAuth API rather than the form, so the password is
   never typed into a field and recorded in the test report */
export async function login(page: Page, path: string) {
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

/* Run `trigger` and capture the server action request it sends, without
   letting it reach the server */
export async function captureAction(
    page: Page,
    trigger: () => Promise<void>,
): Promise<CapturedAction> {
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

    await trigger();
    const action = await captured;
    await page.unroute("**/facility/**");

    return action;
}

/* Replay a captured action with new arguments and return the action's
   response body after checking it is a real server action response */
export async function replayAction(
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
