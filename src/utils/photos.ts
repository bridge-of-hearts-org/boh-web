/* Shared rules for facility photos uploaded from the admin form. Photos are
   stored in Vercel Blob at `<slug>/<fileName>`, the same layout the sync
   script uses, so the rest of the site finds them without changes. */

export const PhotoContentTypes: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
};

export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PHOTO_FILE_NAME_PATTERN = /^[a-f0-9]{16}\.(jpg|png|webp)$/;

export const isValidSlug = (slug: string): boolean => SLUG_PATTERN.test(slug);

export const isValidPhotoFileName = (fileName: string): boolean =>
    PHOTO_FILE_NAME_PATTERN.test(fileName);

/* The content type a photo file name was created for, or null */
export const contentTypeForFileName = (fileName: string): string | null => {
    const extension = fileName.split(".").pop();
    const match = Object.entries(PhotoContentTypes).find(
        ([, ext]) => ext === extension,
    );

    return match ? match[0] : null;
};

/* Returns an error message, or null if the file can be uploaded */
export const validatePhotoFile = (file: {
    name: string;
    type: string;
    size: number;
}): string | null => {
    if (!PhotoContentTypes[file.type]) {
        return `${file.name}: only JPEG, PNG and WebP images can be uploaded`;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
        return `${file.name}: must be ${MAX_PHOTO_SIZE_BYTES / 1024 / 1024} MB or smaller`;
    }

    return null;
};

/* Names a photo after a hash of its contents, so uploading the same photo
   twice can't create a duplicate. The sync script names photos the same way
   but with MD5, which browsers can't compute, so a photo added both here and
   in the sheet gets two different names. */
export const photoFileName = async (file: File): Promise<string> => {
    const digest = await crypto.subtle.digest(
        "SHA-256",
        await file.arrayBuffer(),
    );
    const hash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 16);

    return `${hash}.${PhotoContentTypes[file.type]}`;
};

/* A photo's place in Vercel Blob: `<slug>/<fileName>` */
export type StoredPhoto = { slug: string; fileName: string };

/* The photos to delete from storage, grouped by slug: every candidate that
   isn't in `keep`, without duplicates. The form passes the photos of the saved
   record and the ones uploaded this session as candidates, and the photos
   the record now has (or still has) as `keep`. */
export const photosToDelete = (
    candidates: StoredPhoto[],
    keep: StoredPhoto[],
): Record<string, string[]> => {
    const kept = new Set(keep.map((p) => `${p.slug}/${p.fileName}`));
    const result: Record<string, string[]> = {};

    for (const { slug, fileName } of candidates) {
        if (kept.has(`${slug}/${fileName}`)) {
            continue;
        }

        const fileNames = (result[slug] ??= []);
        if (!fileNames.includes(fileName)) {
            fileNames.push(fileName);
        }
    }

    return result;
};

/* The pathnames of stored photos no facility uses: blobs under a facility
   folder (`<slug>/<file>`) whose facility doesn't list the file, or whose
   slug has no facility. Blobs uploaded after `uploadedBefore` are skipped, so
   photos an admin has just uploaded but not saved yet are left alone, and so
   is anything outside a facility folder. */
export const findOrphanPhotoBlobs = (
    blobs: { pathname: string; uploadedAt: Date }[],
    facilities: { slug: string; photos: { fileName: string }[] }[],
    uploadedBefore: Date,
): string[] => {
    const inUse = new Set(
        facilities.flatMap((f) =>
            f.photos.map((p) => `${f.slug}/${p.fileName}`),
        ),
    );

    return blobs
        .filter((blob) => {
            const parts = blob.pathname.split("/");

            return (
                parts.length === 2 &&
                isValidSlug(parts[0]) &&
                parts[1] !== "" &&
                blob.uploadedAt < uploadedBefore &&
                !inUse.has(blob.pathname)
            );
        })
        .map((blob) => blob.pathname);
};
