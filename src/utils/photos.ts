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

/* Names a photo after a hash of its contents, like the sync script does, so
   uploading the same photo twice can't create a duplicate */
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
