import { test, expect, Page } from "@playwright/test";

import { getExistingSlug, hasCredentials, login } from "./admin-helpers";

/* Traces record request bodies and cookies, which here include the admin
   password and session, and would end up in the uploaded report */
test.use({ trace: "off" });

const viewports = [
    { name: "phone", width: 375, height: 667 },
    { name: "small laptop", width: 1024, height: 768 },
    { name: "laptop", width: 1280, height: 800 },
];

/* The page and the form must both fit the viewport, and every button must sit
   fully inside it, so nothing needs sideways scrolling to reach */
async function expectNoSidewaysScroll(page: Page, width: number) {
    const form = page.locator("form").first();
    await expect(form).toBeVisible();

    const sizes = await page.evaluate(() => {
        const form = document.querySelector("form")!;

        return {
            pageScrollWidth: document.documentElement.scrollWidth,
            formScrollWidth: form.scrollWidth,
            formClientWidth: form.clientWidth,
        };
    });
    expect(sizes.pageScrollWidth).toBeLessThanOrEqual(width);
    expect(sizes.formScrollWidth).toBeLessThanOrEqual(sizes.formClientWidth);

    const buttons = form.getByRole("button");
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
        const box = await buttons.nth(i).boundingBox();
        if (!box) {
            continue;
        }
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
    }

    /* The "Add" buttons beside the phone, email and source inputs (#73) */
    const addButtons = form.getByRole("button", { name: "Add", exact: true });
    await expect(addButtons).toHaveCount(3);
}

/* Add a phone number, an email address and a long source URL, so the lists
   of added entries are measured too. Nothing is saved. */
async function addContactsAndSource(page: Page) {
    const form = page.locator("form").first();
    const addButtons = form.getByRole("button", { name: "Add", exact: true });
    const entries = [
        "0771234567",
        "a.very.long.contact.address@example-childrens-home.org",
        "https://www.example.org/a/very/long/source/path/that/does/not/break/naturally/at/all",
    ];

    for (let i = 0; i < entries.length; i++) {
        const button = addButtons.nth(i);
        await button.locator("xpath=preceding-sibling::input").fill(entries[i]);
        await button.click();
        await expect(form.getByText(entries[i], { exact: true })).toBeVisible();
    }
}

// Admin form tests: need admin credentials. Nothing is saved.
test.describe("Admin facility form fits the screen width", () => {
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

    for (const viewport of viewports) {
        test(`add form doesn't scroll sideways on a ${viewport.name}`, async ({
            page,
        }) => {
            await page.setViewportSize(viewport);
            await login(page, "/facility/new");
            await addContactsAndSource(page);

            await expectNoSidewaysScroll(page, viewport.width);
        });

        test(`edit form doesn't scroll sideways on a ${viewport.name}`, async ({
            page,
        }) => {
            await page.setViewportSize(viewport);
            const slug = await getExistingSlug(page);
            await login(page, `/facility/edit/${slug}`);

            await expectNoSidewaysScroll(page, viewport.width);
        });
    }
});
