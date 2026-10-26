/**
 * copyPhotosToDev.ts
 *
 * Copies the photos of the given facilities from production's photo folder
 * into the dev folder, so local dev and Vercel previews can show realistic
 * photos without reading or changing production's. Photos already in the
 * dev folder are skipped, and production's photos are never changed.
 *
 * Copy the photos of every facility the e2e tests expect to have photos,
 * e.g. the image carousel test's facility.
 *
 * Usage:   npx tsx scripts/copyPhotosToDev.ts <slug> [<slug> ...]
 * Example: npx tsx scripts/copyPhotosToDev.ts children-of-joy-childrens-home-wattala
 */

import { copy, list, ListBlobResultBlob } from "@vercel/blob";
import { config } from "dotenv";

import {
    DEV_PHOTO_FOLDER,
    isPhotoBlobPath,
    isValidSlug,
    photoBlobPath,
} from "../src/utils/photos";

async function listAllBlobs(
    token: string,
    prefix: string,
): Promise<ListBlobResultBlob[]> {
    const blobs: ListBlobResultBlob[] = [];
    let cursor: string | undefined;

    do {
        const page = await list({ cursor, limit: 1000, prefix, token });
        blobs.push(...page.blobs);
        cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    return blobs;
}

async function copyFacilityPhotos(slug: string, token: string) {
    const devPrefix = `${DEV_PHOTO_FOLDER}/${slug}/`;
    const production = (await listAllBlobs(token, `${slug}/`)).filter((b) =>
        isPhotoBlobPath(b.pathname),
    );
    const inDev = new Set(
        (await listAllBlobs(token, devPrefix)).map((b) => b.pathname),
    );

    console.log(`${slug}: ${production.length} photos`);
    for (const blob of production) {
        const fileName = blob.pathname.slice(slug.length + 1);
        const devPath = photoBlobPath(slug, fileName, DEV_PHOTO_FOLDER);
        if (inDev.has(devPath)) {
            console.log(`  Already copied: ${devPath}`);
            continue;
        }

        await copy(blob.url, devPath, {
            access: "public",
            addRandomSuffix: false,
            token,
        });
        console.log(`  Copied: ${devPath}`);
    }
}

async function main() {
    config();

    const slugs = process.argv.slice(2);
    if (slugs.length === 0) {
        console.log(
            "Usage:   npx tsx scripts/copyPhotosToDev.ts <slug> [<slug> ...]",
        );
        process.exit(1);
    }

    const invalid = slugs.filter((slug) => !isValidSlug(slug));
    if (invalid.length > 0) {
        console.log(`Not a facility slug: ${invalid.join(", ")}`);
        process.exit(1);
    }

    /* Same order as the server actions */
    const token = process.env.BLOB_READ_WRITE_TOKEN ?? process.env.VERCEL_TOKEN;
    if (!token) {
        console.log("Set VERCEL_TOKEN to the Blob read-write token");
        process.exit(1);
    }

    for (const slug of slugs) {
        await copyFacilityPhotos(slug, token);
    }
}

main();
