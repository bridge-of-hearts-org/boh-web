/**
 * cleanupOrphanPhotos.ts
 *
 * Lists the photos in Vercel Blob and deletes the ones no facility uses:
 * photos under `<slug>/` that the facility with that slug doesn't list in
 * `photos`, or whose slug has no facility. These are left behind when an
 * admin uploads photos and leaves the form without saving.
 *
 * Only photos uploaded more than a day ago are touched, so photos an admin is
 * uploading right now are safe. Don't run it while syncFacilities.ts runs.
 *
 * It won't delete anything if the database has no facilities or more than 20%
 * of the photos look unused, which suggests the database doesn't match the
 * Blob store. Pass --force to delete anyway.
 *
 * Usage:   npx tsx scripts/cleanupOrphanPhotos.ts            (list only)
 *          npx tsx scripts/cleanupOrphanPhotos.ts --delete   (delete them)
 *          npx tsx scripts/cleanupOrphanPhotos.ts --delete --force
 */

import { del, list, ListBlobResultBlob } from "@vercel/blob";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

import {
    findOrphanPhotoBlobs,
    isPhotoBlobPath,
    orphanCleanupRefusal,
} from "../src/utils/photos";

const MIN_AGE_MS = 24 * 60 * 60 * 1000;
const DELETE_BATCH_SIZE = 100;

async function listAllBlobs(token: string): Promise<ListBlobResultBlob[]> {
    const blobs: ListBlobResultBlob[] = [];
    let cursor: string | undefined;

    do {
        const page = await list({ cursor, limit: 1000, token });
        blobs.push(...page.blobs);
        cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    return blobs;
}

/* Only the host, so the credentials in the URL aren't printed */
function databaseHost(): string {
    try {
        return new URL(process.env.DATABASE_URL ?? "").host || "unknown";
    } catch {
        return "unknown";
    }
}

async function main() {
    config();

    const shouldDelete = process.argv.includes("--delete");
    const force = process.argv.includes("--force");
    /* Same order as the server actions */
    const token = process.env.BLOB_READ_WRITE_TOKEN ?? process.env.VERCEL_TOKEN;
    if (!token) {
        console.log("Set VERCEL_TOKEN to the Blob read-write token");
        process.exit(1);
    }

    console.log(`Connecting to database host: ${databaseHost()}`);
    const prisma = new PrismaClient();

    try {
        /* Read the facilities before the blobs, so a photo synced in between
           is too new to be deleted rather than missing from the list */
        const facilities = await prisma.childCareFacility.findMany({
            select: { slug: true, photos: true },
        });
        const uploadedBefore = new Date(Date.now() - MIN_AGE_MS);
        const blobs = await listAllBlobs(token);
        const orphans = findOrphanPhotoBlobs(blobs, facilities, uploadedBefore);
        const photoBlobCount = blobs.filter((b) =>
            isPhotoBlobPath(b.pathname),
        ).length;

        console.log(
            `${photoBlobCount} photos, ${facilities.length} facilities, ${orphans.length} unused photos`,
        );
        for (const pathname of orphans) {
            console.log(`  ${pathname}`);
        }

        const refusal = orphanCleanupRefusal(
            facilities.length,
            photoBlobCount,
            orphans.length,
        );
        if (refusal) {
            console.log(
                `${refusal}. Check that DATABASE_URL and the Blob token belong together.`,
            );
        }

        if (!shouldDelete) {
            if (orphans.length > 0) {
                console.log("Run again with --delete to delete them");
            }
            return;
        }

        if (refusal && !force) {
            console.log("Nothing deleted. Pass --force to delete anyway.");
            process.exitCode = 1;
            return;
        }

        const urls = new Map(blobs.map((b) => [b.pathname, b.url]));
        for (let i = 0; i < orphans.length; i += DELETE_BATCH_SIZE) {
            const batch = orphans.slice(i, i + DELETE_BATCH_SIZE);
            await del(
                batch.map((pathname) => urls.get(pathname)!),
                { token },
            );
        }
        console.log(`Deleted ${orphans.length} unused photos`);
    } finally {
        await prisma.$disconnect();
    }
}

main();
