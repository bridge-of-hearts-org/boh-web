import { test, expect, Page } from "@playwright/test";

import { captureAction, hasCredentials, login } from "./admin-helpers";

/* A facility with at least one verified phone number, email or occupancy
   count. Nothing in the tests creates one, so the public page tests only run
   when it's set. */
const verifiedFacilitySlug = process.env.E2E_VERIFIED_FACILITY_SLUG;

/* Traces record request bodies and cookies, which here include the admin
   password and session, and would end up in the uploaded report */
test.use({ trace: "off" });

// Admin form tests: need admin credentials. Nothing is saved.
test.describe("Verification dates in the admin form", () => {
    /* Locally the tests are optional, but in CI missing credentials must fail
       rather than skip, or they would silently never run */
    test.skip(
        !hasCredentials && !process.env.CI,
        "Set ADMIN_USERNAME and ADMIN_PASSWORD to run admin form tests",
    );

    test.beforeEach(async ({ page }) => {
        expect(
            hasCredentials,
            "ADMIN_USERNAME and ADMIN_PASSWORD must be set in CI",
        ).toBe(true);

        await login(page, "/facility/new");
    });

    const phone = "0771234567";
    const phoneDate = (page: Page) => page.getByLabel(`${phone} verified on`);
    const occupancyDate = (page: Page) =>
        page.getByLabel("Occupancy counts verified on");
    const totalCount = (page: Page) =>
        page.locator('label:text-is("Total") + input');

    async function addPhone(page: Page) {
        await page
            .locator('label:has-text("Phone Numbers") + div input')
            .fill(phone);
        await page
            .locator('label:has-text("Phone Numbers") + div')
            .getByRole("button", { name: "Add" })
            .click();
        await expect(phoneDate(page)).toBeVisible();
    }

    test("sends each verification date with the facility", async ({ page }) => {
        await page
            .locator('label:has-text("Database Slug") + input')
            .fill("e2e-verification-check");
        await page.locator('label:text-is("Name") + input').fill("E2E Check");
        await addPhone(page);
        await phoneDate(page).fill("2026-03-12");
        await totalCount(page).fill("30");
        await occupancyDate(page).fill("2026-03-20");

        /* The request is captured and aborted, so nothing is saved */
        page.on("dialog", (dialog) => dialog.dismiss());
        const action = await captureAction(page, () =>
            page.getByRole("button", { name: "Submit" }).click(),
        );

        const verification = action.args[0].verification;
        expect(verification.phones).toEqual([
            { value: phone, verifiedAt: expect.stringContaining("2026-03-12") },
        ]);
        expect(verification.occupancy).toMatchObject({
            total: 30,
            verifiedAt: expect.stringContaining("2026-03-20"),
        });
    });

    test("the clear button removes a verification date", async ({ page }) => {
        await addPhone(page);
        await phoneDate(page).fill("2026-03-12");

        await page
            .getByRole("button", { name: `Clear ${phone} verification` })
            .click();

        await expect(phoneDate(page)).toHaveValue("");
    });

    test("a removed and re-added phone number isn't verified", async ({
        page,
    }) => {
        await addPhone(page);
        await phoneDate(page).fill("2026-03-12");

        await page.getByRole("button", { name: `Remove ${phone}` }).click();
        await expect(phoneDate(page)).toHaveCount(0);
        await addPhone(page);

        await expect(phoneDate(page)).toHaveValue("");
    });

    test("changed occupancy counts need a new verification date", async ({
        page,
    }) => {
        await totalCount(page).fill("30");
        await occupancyDate(page).fill("2026-03-20");

        await totalCount(page).fill("31");
        await expect(occupancyDate(page)).toHaveValue("");

        // Back to the verified counts
        await totalCount(page).fill("30");
        await expect(occupancyDate(page)).toHaveValue("2026-03-20");
    });
});

test.describe("Verified checkmarks on the public facility page", () => {
    test.skip(
        !verifiedFacilitySlug,
        "Set E2E_VERIFIED_FACILITY_SLUG to a facility with a verified field",
    );

    const checkmarks = (page: Page) =>
        page.getByRole("button", { name: / verified$/ });
    const note = (page: Page) =>
        page.getByText(
            /^Verified by directly contacting the facility on \d{1,2} \w+ \d{4}\.$/,
        );

    test.beforeEach(async ({ page }) => {
        await page.goto(`/facility/${verifiedFacilitySlug}`);
        await expect(checkmarks(page).first()).toBeVisible({ timeout: 10000 });
    });

    test("clicking a checkmark shows when it was verified", async ({
        page,
    }) => {
        const checkmark = checkmarks(page).first();
        await expect(checkmark).toHaveAttribute("aria-expanded", "false");

        await checkmark.click();

        await expect(checkmark).toHaveAttribute("aria-expanded", "true");
        await expect(note(page)).toBeVisible();
    });

    test("clicking the checkmark again closes the note", async ({ page }) => {
        await checkmarks(page).first().click();
        await checkmarks(page).first().click();

        await expect(note(page)).toHaveCount(0);
    });

    test("clicking the note closes it", async ({ page }) => {
        await checkmarks(page).first().click();
        await note(page).click();

        await expect(note(page)).toHaveCount(0);
    });

    test("pressing Escape closes the note", async ({ page }) => {
        await checkmarks(page).first().click();
        await page.keyboard.press("Escape");

        await expect(note(page)).toHaveCount(0);
    });

    test("clicking elsewhere closes the note", async ({ page }) => {
        await checkmarks(page).first().click();
        await page.locator("h1").first().click();

        await expect(note(page)).toHaveCount(0);
    });

    test("only one note is open at a time", async ({ page }) => {
        test.skip(
            (await checkmarks(page).count()) < 2,
            "Needs a facility with two verified fields",
        );

        /* The lower one first, as an open note can cover the checkmark below it */
        await checkmarks(page).nth(1).click();
        await checkmarks(page).nth(0).click();

        await expect(note(page)).toHaveCount(1);
        await expect(checkmarks(page).nth(1)).toHaveAttribute(
            "aria-expanded",
            "false",
        );
    });
});
