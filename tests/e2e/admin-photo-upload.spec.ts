import { test, expect, Page } from "@playwright/test";

import {
    contentTypeForFileName,
    isValidPhotoFileName,
    isValidSlug,
    MAX_PHOTO_SIZE_BYTES,
    validatePhotoFile,
} from "../../src/utils/photos";
import {
    captureAction,
    hasCredentials,
    login,
    replayAction,
} from "./admin-helpers";

// Pure validation tests: no browser needed
test.describe("Photo upload validation", () => {
    test("accepts lowercase hyphenated slugs only", () => {
        expect(isValidSlug("st-john-childrens-home-moratuwa")).toBe(true);
        expect(isValidSlug("home2")).toBe(true);
        expect(isValidSlug("")).toBe(false);
        expect(isValidSlug("Upper-Case")).toBe(false);
        expect(isValidSlug("../other-home")).toBe(false);
        expect(isValidSlug("a/b")).toBe(false);
        expect(isValidSlug("-leading")).toBe(false);
    });

    test("accepts hashed photo file names only", () => {
        expect(isValidPhotoFileName("0123456789abcdef.jpg")).toBe(true);
        expect(isValidPhotoFileName("0123456789abcdef.webp")).toBe(true);
        expect(isValidPhotoFileName("0123456789abcdef.gif")).toBe(false);
        expect(isValidPhotoFileName("photo.jpg")).toBe(false);
        expect(isValidPhotoFileName("../0123456789abcdef.jpg")).toBe(false);
        expect(contentTypeForFileName("0123456789abcdef.png")).toBe(
            "image/png",
        );
    });

    test("rejects non-images and files over the size limit", () => {
        expect(
            validatePhotoFile({ name: "a.png", type: "image/png", size: 100 }),
        ).toBeNull();
        expect(
            validatePhotoFile({ name: "a.txt", type: "text/plain", size: 100 }),
        ).toContain("only JPEG, PNG and WebP");
        expect(
            validatePhotoFile({
                name: "a.jpg",
                type: "image/jpeg",
                size: MAX_PHOTO_SIZE_BYTES + 1,
            }),
        ).toContain("10 MB or smaller");
    });
});

// A 1x1 PNG. Trailing bytes make each test file's contents, and so its name, unique.
const PNG_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function pngFile(name: string) {
    return {
        name: name,
        mimeType: "image/png",
        buffer: Buffer.concat([
            Buffer.from(PNG_BASE64, "base64"),
            Buffer.from(name),
        ]),
    };
}

/* Answer the browser's upload to Vercel Blob without storing anything, and
   record the paths it uploaded to */
async function mockBlobStorage(page: Page): Promise<string[]> {
    const uploadedPaths: string[] = [];
    const corsHeaders = {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "PUT, OPTIONS",
        "access-control-allow-headers": "*",
    };

    await page.route("https://blob.vercel-storage.com/**", async (route) => {
        if (route.request().method() === "OPTIONS") {
            await route.fulfill({ status: 204, headers: corsHeaders });
            return;
        }

        const pathname = new URL(route.request().url()).pathname.slice(1);
        uploadedPaths.push(pathname);
        await route.fulfill({
            status: 200,
            headers: corsHeaders,
            contentType: "application/json",
            body: JSON.stringify({
                url: `https://example.public.blob.vercel-storage.com/${pathname}`,
                downloadUrl: `https://example.public.blob.vercel-storage.com/${pathname}?download=1`,
                pathname: pathname,
                contentType: "image/png",
                contentDisposition: "inline",
            }),
        });
    });

    return uploadedPaths;
}

/* Traces record request bodies and cookies, which here include the admin
   password and session, and would end up in the uploaded report */
test.use({ trace: "off" });

// Admin form tests: need admin credentials. Nothing is saved and Blob uploads are mocked.
test.describe("Photo upload in the admin facility form", () => {
    /* Locally the tests are optional, but in CI missing credentials must fail
       rather than skip, or they would silently never run */
    test.skip(
        !hasCredentials && !process.env.CI,
        "Set ADMIN_USERNAME and ADMIN_PASSWORD to run admin form tests",
    );

    const slug = "e2e-photo-upload";

    test.beforeEach(async ({ page }) => {
        expect(
            hasCredentials,
            "ADMIN_USERNAME and ADMIN_PASSWORD must be set in CI",
        ).toBe(true);
        await login(page, "/facility/new");
    });

    const slugInput = (page: Page) =>
        page.locator("label", { hasText: "Database Slug" }).locator("+ input");
    const uploadButton = (page: Page) =>
        page.getByRole("button", { name: "Upload Photos" });
    const photoItems = (page: Page) =>
        page.getByRole("list", { name: "Facility photos" }).locator("li");

    test("upload is disabled until a valid slug is entered", async ({
        page,
    }) => {
        await expect(uploadButton(page)).toBeDisabled();

        await slugInput(page).fill("Not A Slug");
        await expect(uploadButton(page)).toBeDisabled();

        await slugInput(page).fill(slug);
        await expect(uploadButton(page)).toBeEnabled();
    });

    test("rejects files that aren't images without uploading", async ({
        page,
    }) => {
        const uploadedPaths = await mockBlobStorage(page);
        await slugInput(page).fill(slug);

        await page.locator("#photo-upload").setInputFiles({
            name: "notes.txt",
            mimeType: "text/plain",
            buffer: Buffer.from("not an image"),
        });

        await expect(
            page
                .getByRole("alert")
                .filter({
                    hasText:
                        "notes.txt: only JPEG, PNG and WebP images can be uploaded",
                }),
        ).toBeVisible();
        await expect(photoItems(page)).toHaveCount(0);
        expect(uploadedPaths).toEqual([]);
    });

    test("uploads, reorders and removes photos", async ({ page }) => {
        const uploadedPaths = await mockBlobStorage(page);
        await slugInput(page).fill(slug);

        await page
            .locator("#photo-upload")
            .setInputFiles([pngFile("first.png"), pngFile("second.png")]);

        await expect(photoItems(page)).toHaveCount(2);
        expect(uploadedPaths).toHaveLength(2);
        for (const path of uploadedPaths) {
            expect(path).toMatch(/^e2e-photo-upload\/[a-f0-9]{16}\.png$/);
        }

        const fileNames = uploadedPaths.map((p) => p.split("/")[1]);
        const shownOrder = () =>
            photoItems(page).evaluateAll((items) =>
                items.map((item) => item.getAttribute("data-file-name")),
            );
        expect(await shownOrder()).toEqual(fileNames);

        // The slug is locked while photos are stored under it
        await expect(slugInput(page)).toHaveAttribute("readonly", "");

        // Uploading the same photo again doesn't add a duplicate
        await page.locator("#photo-upload").setInputFiles(pngFile("first.png"));
        await expect(
            page
                .getByRole("alert")
                .filter({ hasText: "first.png: this photo is already added" }),
        ).toBeVisible();
        await expect(photoItems(page)).toHaveCount(2);

        await page
            .getByRole("button", { name: "Move photo 2 earlier" })
            .click();
        await expect.poll(shownOrder).toEqual([fileNames[1], fileNames[0]]);

        await page.getByRole("button", { name: "Remove photo 1" }).click();
        await expect.poll(shownOrder).toEqual([fileNames[0]]);

        await page.getByRole("button", { name: "Remove photo 1" }).click();
        await expect(photoItems(page)).toHaveCount(0);
        await expect(slugInput(page)).not.toHaveAttribute("readonly");
    });

    test("createPhotoUploadToken rejects unauthenticated calls but lets admins through", async ({
        page,
        request,
    }) => {
        await slugInput(page).fill(slug);
        const action = await captureAction(page, () =>
            page.locator("#photo-upload").setInputFiles(pngFile("token.png")),
        );

        /* Only issues a token; nothing is uploaded or saved */
        const unauthBody = await replayAction(
            request,
            "/facility/new",
            action,
            action.args,
        );
        expect(unauthBody).toContain("Unauthorized");
        expect(unauthBody).not.toContain("vercel_blob_client_");

        const adminBody = await replayAction(
            page.request,
            "/facility/new",
            action,
            action.args,
        );
        expect(adminBody).not.toContain("Unauthorized");
        expect(adminBody).toContain("vercel_blob_client_");
    });
});
