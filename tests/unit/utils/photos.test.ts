import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    chunk,
    contentTypeForFileName,
    currentPhotoFolder,
    deletePhotosInBatches,
    DEV_PHOTO_FOLDER,
    findOrphanPhotoBlobs,
    isBlobAlreadyExistsError,
    isDeletablePhotoFileName,
    isPhotoBlobPath,
    isValidPhotoFileName,
    isValidSlug,
    MAX_ORPHAN_SHARE,
    MAX_PHOTO_SIZE_BYTES,
    MAX_PHOTOS_PER_DELETE,
    orphanCleanupRefusal,
    planDevPhotoCopies,
    photoBlobPath,
    photoFileName,
    photosToDelete,
    photoUrl,
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

    it("takes the extension from the content type, not the original name", async () => {
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

describe("photosToDelete", () => {
    const photo = (slug: string, fileName: string) => ({ slug, fileName });

    it("returns the candidates that aren't kept, grouped by slug", () => {
        expect(
            photosToDelete(
                [
                    photo("home", "a.png"),
                    photo("home", "b.png"),
                    photo("other", "c.png"),
                ],
                [photo("home", "a.png")],
            ),
        ).toEqual({ home: ["b.png"], other: ["c.png"] });
    });

    it("never deletes a kept photo", () => {
        expect(
            photosToDelete(
                [photo("home", "a.png"), photo("home", "b.png")],
                [photo("home", "a.png"), photo("home", "b.png")],
            ),
        ).toEqual({});
    });

    it("matches kept photos by slug as well as file name", () => {
        expect(
            photosToDelete(
                [photo("old-slug", "a.png")],
                [photo("new-slug", "a.png")],
            ),
        ).toEqual({ "old-slug": ["a.png"] });
    });

    it("lists each photo once", () => {
        expect(
            photosToDelete(
                [photo("home", "a.png"), photo("home", "a.png")],
                [],
            ),
        ).toEqual({ home: ["a.png"] });
    });

    it("returns nothing without candidates", () => {
        expect(photosToDelete([], [photo("home", "a.png")])).toEqual({});
    });
});

describe("isDeletablePhotoFileName", () => {
    it.each([
        "0123456789abcdef.jpg",
        "0123456789abcdef.png",
        "0123456789abcdef.webp",
        "0123456789abcdef.gif",
    ])("accepts %j", (fileName) => {
        expect(isDeletablePhotoFileName(fileName)).toBe(true);
    });

    it.each([
        "photo.png",
        "0123456789abcdef.svg",
        "../0123456789abcdef.png",
        "home/0123456789abcdef.png",
        "",
        123,
        null,
    ])("rejects %j", (fileName) => {
        expect(isDeletablePhotoFileName(fileName)).toBe(false);
    });

    it("leaves upload validation unchanged: GIFs can't be uploaded", () => {
        expect(isValidPhotoFileName("0123456789abcdef.gif")).toBe(false);
    });
});

describe("chunk", () => {
    it("splits a list into lists of at most the given size", () => {
        expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it("returns no chunks for an empty list", () => {
        expect(chunk([], 50)).toEqual([]);
    });
});

describe("deletePhotosInBatches", () => {
    const photo = (slug: string, fileName: string) => ({ slug, fileName });
    const name = (i: number) => `${i.toString(16).padStart(16, "0")}.png`;

    beforeEach(() => {
        vi.spyOn(console, "log").mockImplementation(() => {});
    });

    it("deletes the photos that aren't kept and returns what was deleted", async () => {
        const deleteBatch = vi.fn(async (_: string, fileNames: string[]) => ({
            deleted: fileNames,
        }));

        expect(
            await deletePhotosInBatches(
                [photo("home", "a.png"), photo("home", "b.png")],
                [photo("home", "a.png")],
                deleteBatch,
            ),
        ).toEqual([photo("home", "b.png")]);
        expect(deleteBatch).toHaveBeenCalledExactlyOnceWith("home", ["b.png"]);
    });

    it("returns only the photos the server reports deleted", async () => {
        const deleteBatch = vi.fn(async () => ({ deleted: ["a.png"] }));

        expect(
            await deletePhotosInBatches(
                [photo("home", "a.png"), photo("home", "b.png")],
                [],
                deleteBatch,
            ),
        ).toEqual([photo("home", "a.png")]);
    });

    it(`sends at most ${MAX_PHOTOS_PER_DELETE} names per call`, async () => {
        const names = Array.from({ length: 120 }, (_, i) => name(i));
        const deleteBatch = vi.fn(async (_: string, fileNames: string[]) => ({
            deleted: fileNames,
        }));

        const deleted = await deletePhotosInBatches(
            names.map((n) => photo("home", n)),
            [],
            deleteBatch,
        );

        expect(deleteBatch.mock.calls.map(([, n]) => n.length)).toEqual([
            50, 50, 20,
        ]);
        expect(deleted).toHaveLength(120);
    });

    it("calls once per slug", async () => {
        const deleteBatch = vi.fn(async (_: string, fileNames: string[]) => ({
            deleted: fileNames,
        }));

        await deletePhotosInBatches(
            [photo("old-slug", "a.png"), photo("new-slug", "b.png")],
            [],
            deleteBatch,
        );

        expect(deleteBatch.mock.calls).toEqual([
            ["old-slug", ["a.png"]],
            ["new-slug", ["b.png"]],
        ]);
    });

    it("skips failed batches and still runs the others", async () => {
        const names = Array.from({ length: 60 }, (_, i) => name(i));
        const deleteBatch = vi
            .fn()
            .mockRejectedValueOnce(new Error("network"))
            .mockResolvedValueOnce({ deleted: names.slice(50) });

        expect(
            await deletePhotosInBatches(
                names.map((n) => photo("home", n)),
                [],
                deleteBatch,
            ),
        ).toEqual(names.slice(50).map((n) => photo("home", n)));
    });

    it("returns nothing deleted when the server reports an error", async () => {
        const deleteBatch = vi.fn(async () => ({ error: "Unauthorized" }));

        expect(
            await deletePhotosInBatches(
                [photo("home", "a.png")],
                [],
                deleteBatch,
            ),
        ).toEqual([]);
    });

    it("doesn't call the server when there's nothing to delete", async () => {
        const deleteBatch = vi.fn();

        await deletePhotosInBatches(
            [photo("home", "a.png")],
            [photo("home", "a.png")],
            deleteBatch,
        );

        expect(deleteBatch).not.toHaveBeenCalled();
    });
});

describe("findOrphanPhotoBlobs", () => {
    const USED = "aaaaaaaaaaaaaaaa.png";
    const UNUSED = "bbbbbbbbbbbbbbbb.jpg";
    const cutoff = new Date("2026-01-02T00:00:00Z");
    const old = new Date("2026-01-01T00:00:00Z");
    const recent = new Date("2026-01-03T00:00:00Z");
    const facilities = [
        { slug: "home", photos: [{ fileName: USED }] },
        { slug: "empty-home", photos: [] },
    ];

    it("finds old photos no facility lists", () => {
        expect(
            findOrphanPhotoBlobs(
                [
                    { pathname: `home/${USED}`, uploadedAt: old },
                    { pathname: `home/${UNUSED}`, uploadedAt: old },
                    { pathname: `empty-home/${UNUSED}`, uploadedAt: old },
                    {
                        pathname: "no-facility/cccccccccccccccc.gif",
                        uploadedAt: old,
                    },
                ],
                facilities,
                cutoff,
            ),
        ).toEqual([
            `home/${UNUSED}`,
            `empty-home/${UNUSED}`,
            "no-facility/cccccccccccccccc.gif",
        ]);
    });

    it("only counts a file as used under its own facility's slug", () => {
        expect(
            findOrphanPhotoBlobs(
                [{ pathname: `empty-home/${USED}`, uploadedAt: old }],
                facilities,
                cutoff,
            ),
        ).toEqual([`empty-home/${USED}`]);
    });

    it("leaves recent uploads alone, as they may not be saved yet", () => {
        expect(
            findOrphanPhotoBlobs(
                [{ pathname: `home/${UNUSED}`, uploadedAt: recent }],
                facilities,
                cutoff,
            ),
        ).toEqual([]);
    });

    it.each([
        "root-file.png",
        `${UNUSED}`,
        `home/nested/${UNUSED}`,
        `Not A Slug/${UNUSED}`,
        "home/",
        "home/logo.png",
        "home/bbbbbbbbbbbbbbbb.pdf",
    ])("ignores %j, which isn't a facility photo", (pathname) => {
        expect(isPhotoBlobPath(pathname)).toBe(false);
        expect(
            findOrphanPhotoBlobs(
                [{ pathname, uploadedAt: old }],
                facilities,
                cutoff,
            ),
        ).toEqual([]);
    });
});

describe("findOrphanPhotoBlobs in a folder", () => {
    const USED = "aaaaaaaaaaaaaaaa.png";
    const UNUSED = "bbbbbbbbbbbbbbbb.jpg";
    const old = new Date("2026-01-01T00:00:00Z");
    const cutoff = new Date("2026-01-02T00:00:00Z");
    const facilities = [{ slug: "home", photos: [{ fileName: USED }] }];

    it("only looks at photos in the folder", () => {
        expect(
            findOrphanPhotoBlobs(
                [
                    { pathname: `dev/home/${USED}`, uploadedAt: old },
                    { pathname: `dev/home/${UNUSED}`, uploadedAt: old },
                    { pathname: `home/${UNUSED}`, uploadedAt: old },
                ],
                facilities,
                cutoff,
                "dev",
            ),
        ).toEqual([`dev/home/${UNUSED}`]);
    });

    it("leaves the dev folder alone when cleaning production", () => {
        expect(
            findOrphanPhotoBlobs(
                [{ pathname: `dev/home/${UNUSED}`, uploadedAt: old }],
                facilities,
                cutoff,
            ),
        ).toEqual([]);
    });

    it.each([
        `dev/${UNUSED}`,
        `dev/home/nested/${UNUSED}`,
        `other/home/${UNUSED}`,
    ])("ignores %j, which isn't a photo in the folder", (pathname) => {
        expect(isPhotoBlobPath(pathname, "dev")).toBe(false);
    });
});

describe("currentPhotoFolder", () => {
    it("reads the folder next.config.ts sets", () => {
        vi.stubEnv("NEXT_PUBLIC_PHOTO_FOLDER", "");
        expect(currentPhotoFolder()).toBe("");

        vi.stubEnv("NEXT_PUBLIC_PHOTO_FOLDER", "dev");
        expect(currentPhotoFolder()).toBe("dev");
    });

    it("falls back to the dev folder when it isn't set", () => {
        vi.stubEnv("NEXT_PUBLIC_PHOTO_FOLDER", undefined);
        expect(currentPhotoFolder()).toBe(DEV_PHOTO_FOLDER);
    });
});

describe("photoBlobPath", () => {
    it("puts production's photos under their slug", () => {
        expect(photoBlobPath("home", "aaaaaaaaaaaaaaaa.png", "")).toBe(
            "home/aaaaaaaaaaaaaaaa.png",
        );
    });

    it("puts other photos under the folder", () => {
        expect(photoBlobPath("home", "aaaaaaaaaaaaaaaa.png", "dev")).toBe(
            "dev/home/aaaaaaaaaaaaaaaa.png",
        );
    });

    it("defaults to this deployment's folder", () => {
        vi.stubEnv("NEXT_PUBLIC_PHOTO_FOLDER", "dev");
        expect(photoBlobPath("home", "aaaaaaaaaaaaaaaa.png")).toBe(
            "dev/home/aaaaaaaaaaaaaaaa.png",
        );
    });
});

describe("photoUrl", () => {
    const STORAGE = "https://hzhlx0obnpowbirz.public.blob.vercel-storage.com";

    it("points at this deployment's photo folder", () => {
        vi.stubEnv("NEXT_PUBLIC_PHOTO_FOLDER", "");
        expect(photoUrl("home", "aaaaaaaaaaaaaaaa.png")).toBe(
            `${STORAGE}/home/aaaaaaaaaaaaaaaa.png`,
        );

        vi.stubEnv("NEXT_PUBLIC_PHOTO_FOLDER", "dev");
        expect(photoUrl("home", "aaaaaaaaaaaaaaaa.png")).toBe(
            `${STORAGE}/dev/home/aaaaaaaaaaaaaaaa.png`,
        );
    });
});

describe("isBlobAlreadyExistsError", () => {
    it("recognises Vercel Blob's already-exists error", () => {
        expect(
            isBlobAlreadyExistsError(
                new Error("Vercel Blob: This blob already exists"),
            ),
        ).toBe(true);
    });

    it.each([new Error("Vercel Blob: Unknown error"), "already exists", null])(
        "ignores %j",
        (error) => {
            expect(isBlobAlreadyExistsError(error)).toBe(false);
        },
    );
});

describe("planDevPhotoCopies", () => {
    const STORAGE = "https://hzhlx0obnpowbirz.public.blob.vercel-storage.com";
    const PHOTO = "aaaaaaaaaaaaaaaa.png";
    const OTHER = "bbbbbbbbbbbbbbbb.jpg";
    const blob = (pathname: string) => ({
        pathname,
        url: `${STORAGE}/${pathname}`,
    });

    it("copies the chosen facilities' production photos into the dev folder", () => {
        expect(
            planDevPhotoCopies(
                [
                    blob(`home/${PHOTO}`),
                    blob(`home/${OTHER}`),
                    blob(`other-home/${PHOTO}`),
                ],
                new Set(["home"]),
            ),
        ).toEqual([
            { url: `${STORAGE}/home/${PHOTO}`, devPath: `dev/home/${PHOTO}` },
            { url: `${STORAGE}/home/${OTHER}`, devPath: `dev/home/${OTHER}` },
        ]);
    });

    it("skips photos already in the dev folder", () => {
        expect(
            planDevPhotoCopies(
                [
                    blob(`home/${PHOTO}`),
                    blob(`home/${OTHER}`),
                    blob(`dev/home/${PHOTO}`),
                ],
                new Set(["home"]),
            ),
        ).toEqual([
            { url: `${STORAGE}/home/${OTHER}`, devPath: `dev/home/${OTHER}` },
        ]);
    });

    it("never copies dev photos or blobs that aren't photos", () => {
        expect(
            planDevPhotoCopies(
                [
                    blob(`dev/home/${PHOTO}`),
                    blob("home/logo.png"),
                    blob(`home/nested/${PHOTO}`),
                    blob(PHOTO),
                ],
                new Set(["home", "dev"]),
            ),
        ).toEqual([]);
    });
});

describe("orphanCleanupRefusal", () => {
    it("allows a cleanup of a small share of the photos", () => {
        expect(orphanCleanupRefusal(370, 1000, 200)).toBeNull();
        expect(orphanCleanupRefusal(370, 1000, 0)).toBeNull();
    });

    it("refuses when the database has no facilities", () => {
        expect(orphanCleanupRefusal(0, 1000, 0)).toBe(
            "The database has no facilities",
        );
    });

    it(`refuses when more than ${MAX_ORPHAN_SHARE * 100}% of the photos look unused`, () => {
        expect(orphanCleanupRefusal(370, 1000, 201)).toBe(
            "201 of 1000 photos look unused, more than 20%",
        );
    });

    it("refuses when every photo looks unused", () => {
        expect(orphanCleanupRefusal(5, 10, 10)).not.toBeNull();
    });
});
