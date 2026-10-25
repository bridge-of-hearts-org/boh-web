import { describe, expect, it } from "vitest";

import {
    contentTypeForFileName,
    isValidPhotoFileName,
    isValidSlug,
    MAX_PHOTO_SIZE_BYTES,
    photoFileName,
    validatePhotoFile,
} from "@/utils/photos";

describe("isValidSlug", () => {
    it.each(["home", "sacred-heart-home", "home-2", "a1b2"])(
        "accepts %j",
        (slug) => {
            expect(isValidSlug(slug)).toBe(true);
        },
    );

    /* The slug becomes a Blob path prefix, so anything path-like must be rejected */
    it.each([
        "",
        "Home",
        "home--2",
        "-home",
        "home-",
        "home 2",
        "home/2",
        "../home",
        "home_2",
    ])("rejects %j", (slug) => {
        expect(isValidSlug(slug)).toBe(false);
    });
});

describe("isValidPhotoFileName", () => {
    it.each([
        "0123456789abcdef.jpg",
        "0123456789abcdef.png",
        "0123456789abcdef.webp",
    ])("accepts %j", (fileName) => {
        expect(isValidPhotoFileName(fileName)).toBe(true);
    });

    it.each([
        "0123456789abcdef.jpeg",
        "0123456789abcdef.gif",
        "0123456789ABCDEF.jpg",
        "0123456789abcde.jpg",
        "0123456789abcdef0.jpg",
        "0123456789abcdeg.jpg",
        "../0123456789abcdef.jpg",
        "0123456789abcdef.jpg/x",
        "photo.jpg",
    ])("rejects %j", (fileName) => {
        expect(isValidPhotoFileName(fileName)).toBe(false);
    });
});

describe("contentTypeForFileName", () => {
    it.each([
        ["a.jpg", "image/jpeg"],
        ["a.png", "image/png"],
        ["a.webp", "image/webp"],
    ])("maps %j to %j", (fileName, contentType) => {
        expect(contentTypeForFileName(fileName)).toBe(contentType);
    });

    it.each(["a.gif", "a.jpeg", "a.JPG", "photo"])(
        "returns null for %j",
        (fileName) => {
            expect(contentTypeForFileName(fileName)).toBeNull();
        },
    );
});

describe("validatePhotoFile", () => {
    it("accepts a supported image within the size limit", () => {
        expect(
            validatePhotoFile({
                name: "a.jpg",
                type: "image/jpeg",
                size: MAX_PHOTO_SIZE_BYTES,
            }),
        ).toBeNull();
    });

    it("rejects unsupported file types", () => {
        expect(
            validatePhotoFile({ name: "a.gif", type: "image/gif", size: 100 }),
        ).toBe("a.gif: only JPEG, PNG and WebP images can be uploaded");
    });

    it("rejects files over the size limit", () => {
        expect(
            validatePhotoFile({
                name: "a.png",
                type: "image/png",
                size: MAX_PHOTO_SIZE_BYTES + 1,
            }),
        ).toBe("a.png: must be 10 MB or smaller");
    });
});

describe("photoFileName", () => {
    it("names the photo after the first 16 hex characters of its SHA-256", async () => {
        const file = new File(["hello"], "original-name.png", {
            type: "image/png",
        });

        /* sha256("hello") = 2cf24dba5fb0a30e26e83b2ac5b9e29e... */
        expect(await photoFileName(file)).toBe("2cf24dba5fb0a30e.png");
    });

    it("uses the extension for the content type, not the original name", async () => {
        const file = new File(["hello"], "photo.jpeg", { type: "image/jpeg" });

        expect(await photoFileName(file)).toBe("2cf24dba5fb0a30e.jpg");
    });

    it("gives the same contents the same name and different contents different names", async () => {
        const a = new File(["hello"], "a.webp", { type: "image/webp" });
        const b = new File(["hello"], "b.webp", { type: "image/webp" });
        const c = new File(["world"], "c.webp", { type: "image/webp" });

        expect(await photoFileName(a)).toBe(await photoFileName(b));
        expect(await photoFileName(a)).not.toBe(await photoFileName(c));
    });

    it("produces a name the upload token accepts", async () => {
        const file = new File(["hello"], "a.png", { type: "image/png" });

        expect(isValidPhotoFileName(await photoFileName(file))).toBe(true);
    });
});
