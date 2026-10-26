/* Shared rules for facility photos uploaded from the admin form. Photos are
   stored in Vercel Blob at `<slug>/<fileName>`, the same layout the sync
   script uses, so the rest of the site finds them without changes. Outside
   production they go under DEV_PHOTO_FOLDER instead. */

import { vercelStorageUrl } from "./defines";
import { DEV_PHOTO_FOLDER } from "./photoFolder";

export { DEV_PHOTO_FOLDER, photoFolderFor } from "./photoFolder";

/* This deployment's photo folder. next.config.ts sets it at build time, so
   the browser and the server agree on it. */
export const currentPhotoFolder = (): string =>
    process.env.NEXT_PUBLIC_PHOTO_FOLDER ?? DEV_PHOTO_FOLDER;

/* A photo's pathname in Vercel Blob: `[<folder>/]<slug>/<fileName>` */
export const photoBlobPath = (
    slug: string,
    fileName: string,
    folder: string = currentPhotoFolder(),
): string => (folder ? `${folder}/${slug}/${fileName}` : `${slug}/${fileName}`);

/* A photo's public URL in this deployment's photo folder */
export const photoUrl = (slug: string, fileName: string): string =>
    `${vercelStorageUrl}/${photoBlobPath(slug, fileName)}`;

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

/* Names of stored photos that may be deleted: the form's uploads and the
   sync script's photos, which can also be GIFs */
const DELETABLE_PHOTO_FILE_NAME_PATTERN = /^[a-f0-9]{16}\.(jpg|png|webp|gif)$/;

export const isDeletablePhotoFileName = (fileName: unknown): boolean =>
    typeof fileName === "string" &&
    DELETABLE_PHOTO_FILE_NAME_PATTERN.test(fileName);

/* The most photo names one deleteUnusedPhotos call accepts */
export const MAX_PHOTOS_PER_DELETE = 50;

/* Splits a list into lists of at most `size` items */
export const chunk = <T>(items: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }

    return chunks;
};

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

/* Whether a failed upload failed because the blob is already stored. Photos
   are named after their contents, so the stored blob is the same photo. */
export const isBlobAlreadyExistsError = (error: unknown): boolean =>
    error instanceof Error && /already exists/i.test(error.message);

/* A photo's place in Vercel Blob, within the photo folder */
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

/* Deletes the candidates not in `keep` through `deleteBatch` (the
   deleteUnusedPhotos server action), at most MAX_PHOTOS_PER_DELETE names per
   call, and returns the photos it reports deleted. Failed calls are logged
   and skipped, so the other batches still run. */
export const deletePhotosInBatches = async (
    candidates: StoredPhoto[],
    keep: StoredPhoto[],
    deleteBatch: (
        slug: string,
        fileNames: string[],
    ) => Promise<{ deleted: string[] } | { error: string }>,
): Promise<StoredPhoto[]> => {
    const deleted: StoredPhoto[] = [];

    for (const [slug, fileNames] of Object.entries(
        photosToDelete(candidates, keep),
    )) {
        for (const batch of chunk(fileNames, MAX_PHOTOS_PER_DELETE)) {
            try {
                const result = await deleteBatch(slug, batch);
                if ("error" in result) {
                    console.log("Couldn't delete unused photos", result.error);
                    continue;
                }

                for (const fileName of result.deleted) {
                    deleted.push({ slug, fileName });
                }
            } catch (error) {
                console.log("Couldn't delete unused photos", error);
            }
        }
    }

    return deleted;
};

/* Whether a blob is a facility photo in `folder`:
   `[<folder>/]<slug>/<hashed photo name>`. Anything else in the store,
   including photos in another folder, is never treated as a photo. */
export const isPhotoBlobPath = (pathname: string, folder = ""): boolean => {
    if (folder) {
        if (!pathname.startsWith(`${folder}/`)) {
            return false;
        }

        pathname = pathname.slice(folder.length + 1);
    }

    const parts = pathname.split("/");

    return (
        parts.length === 2 &&
        isValidSlug(parts[0]) &&
        isDeletablePhotoFileName(parts[1])
    );
};

/* The pathnames of stored photos no facility uses: photo blobs whose
   facility doesn't list them, or whose slug has no facility. Blobs uploaded
   after `uploadedBefore` are skipped, so photos an admin has just uploaded
   but not saved yet are left alone. Only photos in `folder` are looked at. */
export const findOrphanPhotoBlobs = (
    blobs: { pathname: string; uploadedAt: Date }[],
    facilities: { slug: string; photos: { fileName: string }[] }[],
    uploadedBefore: Date,
    folder = "",
): string[] => {
    const inUse = new Set(
        facilities.flatMap((f) =>
            f.photos.map((p) => photoBlobPath(f.slug, p.fileName, folder)),
        ),
    );

    return blobs
        .filter(
            (blob) =>
                isPhotoBlobPath(blob.pathname, folder) &&
                blob.uploadedAt < uploadedBefore &&
                !inUse.has(blob.pathname),
        )
        .map((blob) => blob.pathname);
};

/* The share of photo blobs above which the cleanup script stops unless
   forced: that many unused photos more likely means the wrong database */
export const MAX_ORPHAN_SHARE = 0.2;

/* Why the cleanup script shouldn't delete the orphans it found, or null. It
   guards against running with an empty or different database than the one
   the Blob store belongs to, which would make every photo look unused. */
export const orphanCleanupRefusal = (
    facilityCount: number,
    photoBlobCount: number,
    orphanCount: number,
): string | null => {
    if (facilityCount === 0) {
        return "The database has no facilities";
    }

    if (orphanCount > photoBlobCount * MAX_ORPHAN_SHARE) {
        return `${orphanCount} of ${photoBlobCount} photos look unused, more than ${MAX_ORPHAN_SHARE * 100}%`;
    }

    return null;
};
