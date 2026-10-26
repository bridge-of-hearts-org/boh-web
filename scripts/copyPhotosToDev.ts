/**
 * copyPhotosToDev.ts
 *
 * Copies facility photos from production's photo folder into the dev
 * folder, so local dev and Vercel previews can show realistic photos without
 * reading or changing production's. Photos already in the dev folder are
 * skipped, and production's photos are never changed.
 *
 * Pass the slugs to copy, or --all to copy the photos of every facility in
 * the database DATABASE_URL points at (the dev database). At the least, copy
 * the facilities the e2e tests expect to have photos, e.g. the image carousel
 * test's facility.
 *
 * Usage:   npx tsx scripts/copyPhotosToDev.ts <slug> [<slug> ...]
 *          npx tsx scripts/copyPhotosToDev.ts --all
 * Example: npx tsx scripts/copyPhotosToDev.ts children-of-joy-childrens-home-wattala
 */

import { copy, list, ListBlobResultBlob } from "@vercel/blob";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

import { isValidSlug, planDevPhotoCopies } from "../src/utils/photos";

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

/* The slugs of every facility in the database */
async function allFacilitySlugs(): Promise<string[]> {
    console.log(`Connecting to database host: ${databaseHost()}`);
    const prisma = new PrismaClient();

    try {
        const facilities = await prisma.childCareFacility.findMany({
            select: { slug: true },
        });

        return facilities.map((f) => f.slug);
    } finally {
        await prisma.$disconnect();
    }
}

async function main() {
    config();

    const args = process.argv.slice(2);
    const copyAll = args.includes("--all");
    const slugArgs = args.filter((arg) => arg !== "--all");
    if (copyAll === slugArgs.length > 0) {
        console.log(
            "Usage:   npx tsx scripts/copyPhotosToDev.ts <slug> [<slug> ...]",
        );
        console.log("         npx tsx scripts/copyPhotosToDev.ts --all");
        process.exit(1);
    }

    const invalid = slugArgs.filter((slug) => !isValidSlug(slug));
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

    const slugs = new Set(copyAll ? await allFacilitySlugs() : slugArgs);
    const copies = planDevPhotoCopies(await listAllBlobs(token), slugs);
    console.log(`${slugs.size} facilities, ${copies.length} photos to copy`);

    for (const { url, devPath } of copies) {
        await copy(url, devPath, {
            access: "public",
            addRandomSuffix: false,
            token,
        });
        console.log(`  Copied: ${devPath}`);
    }
}

main();
