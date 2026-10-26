/**
 * syncFacilities.ts
 *
 * Pulls children's home data from a Google Sheet tab, downloads photos,
 * upserts facilities into the database, and uploads photos to Vercel Blob.
 *
 * Photos go to production's photo folder. Pass --dev when syncing into the
 * dev database, so they go to the dev folder instead.
 *
 * Usage:   npx tsx scripts/syncFacilities.ts <sheet-name> [--dev]
 * Example: npx tsx scripts/syncFacilities.ts "Central Province"
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { google } from "googleapis";
import { put, list } from "@vercel/blob";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

import {
    detectImageType,
    fileTypeFromUrl,
    mergeSheetVerification,
    parseRow,
} from "./syncHelpers";
import { DEV_PHOTO_FOLDER, photoBlobPath } from "../src/utils/photos";

const SCRIPTS_DIR = __dirname;
const PHOTOS_DIR = path.join(SCRIPTS_DIR, "data", "photos");
const CREDENTIALS_FILE = path.join(SCRIPTS_DIR, "google-api-key.json");
const CONFIG_FILE = path.join(SCRIPTS_DIR, "config.json");

const { "google-sheet-id": SHEET_ID } = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
const GOOGLE_CREDENTIALS = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, "utf-8"));

const prisma = new PrismaClient();

// --- Photo download ---

async function downloadPhoto(
    facilityName: string,
    url: string,
    outputDir: string,
): Promise<{ fileName: string; source: string } | null> {
    try {
        const resp = await fetch(url.trim());
        if (!resp.ok) {
            console.error(
                `  Error downloading photo: ${facilityName} | ${url} | ${resp.status}`,
            );
            return null;
        }

        const buffer = Buffer.from(await resp.arrayBuffer());
        const fileType = detectImageType(buffer) ?? fileTypeFromUrl(url);

        if (!fileType) {
            console.error(`  Could not determine file type: ${facilityName} | ${url}`);
            return null;
        }

        const fileName =
            crypto.createHash("md5").update(buffer).digest("hex").slice(0, 16) +
            "." +
            fileType;

        fs.writeFileSync(path.join(outputDir, fileName), buffer);
        return { fileName, source: url };
    } catch (e) {
        console.error(`  Error downloading photo: ${facilityName} | ${url}`, e);
        return null;
    }
}

// --- Google Sheets ---

async function pullFromSheet(sheetName: string): Promise<Record<string, string>[]> {
    const auth = new google.auth.GoogleAuth({
        credentials: GOOGLE_CREDENTIALS,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const result = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!A1:AZ`,
    });

    const values = result.data.values;
    if (!values || values.length < 2) {
        throw new Error(`No data found in sheet: "${sheetName}"`);
    }

    const headers = values[0] as string[];
    return values.slice(1).map((row) => {
        const record: Record<string, string> = {};
        headers.forEach((header, i) => {
            record[header] = ((row[i] as string) ?? "").trim();
        });
        return record;
    });
}

// --- Vercel Blob upload ---

async function vercelUpload(
    vercelPath: string,
    fileBuffer: Buffer,
): Promise<void> {
    const blobs = await list({
        prefix: vercelPath,
        token: process.env.VERCEL_TOKEN,
    });
    const blobExists = blobs.blobs.some((b) => b.pathname === vercelPath);

    if (!blobExists) {
        const newBlob = await put(vercelPath, fileBuffer, {
            access: "public",
            token: process.env.VERCEL_TOKEN,
            addRandomSuffix: false,
        });
        console.log(`    Uploaded: ${newBlob.url}`);
    } else {
        console.log(`    Already exists: ${vercelPath}`);
    }
}

// --- Main sync ---

async function syncSheet(sheetName: string, photoFolder: string) {
    console.log(`\nPulling data from sheet: "${sheetName}"`);
    const rows = await pullFromSheet(sheetName);

    const facilities = (await Promise.all(rows.map(parseRow))).filter(Boolean) as NonNullable<
        Awaited<ReturnType<typeof parseRow>>
    >[];
    console.log(`  ${facilities.length} valid facilities found`);

    let upsertedCount = 0;

    for (const facility of facilities) {
        const { photoUrls, sheetVerification, warnings, ...facilityData } =
            facility;

        for (const warning of warnings) {
            console.warn(`  Warning: ${warning}`);
        }

        // Download photos
        const photos: { fileName: string; source: string }[] = [];
        if (photoUrls.length > 0) {
            const outputDir = path.join(PHOTOS_DIR, facility.slug);
            fs.mkdirSync(outputDir, { recursive: true });
            const results = await Promise.all(
                photoUrls.map((url) => downloadPhoto(facility.name, url, outputDir)),
            );
            photos.push(...(results.filter(Boolean) as typeof photos));
        }

        try {
            // Merge new photos with existing ones — preserves already-uploaded
            // photos whose source URLs may have become unavailable since last sync.
            const existing = await prisma.childCareFacility.findUnique({
                where: { slug: facilityData.slug },
                select: { photos: true, verification: true },
            });
            const mergedPhotos = new Map(
                (existing?.photos ?? []).map((p) => [p.fileName, p]),
            );
            for (const photo of photos) {
                mergedPhotos.set(photo.fileName, photo);
            }
            const finalPhotos = Array.from(mergedPhotos.values());

            const verification = mergeSheetVerification(
                sheetVerification,
                facilityData,
                existing,
            );

            const entry = await prisma.childCareFacility.upsert({
                where: { slug: facilityData.slug },
                create: { ...facilityData, photos: finalPhotos, verification },
                update: {
                    name: facilityData.name,
                    type: facilityData.type,
                    managedBy: facilityData.managedBy,
                    description: facilityData.description,
                    location: facilityData.location,
                    contact: facilityData.contact,
                    genders: facilityData.genders,
                    occupancy: facilityData.occupancy,
                    ageRanges: facilityData.ageRanges,
                    photos: finalPhotos,
                    sources: facilityData.sources,
                    verification: verification,
                },
            });

            upsertedCount++;

            // Upload photos to Vercel Blob
            if (photos.length > 0) {
                const facilityPhotosDir = path.join(PHOTOS_DIR, entry.slug);
                await Promise.all(
                    photos.map(async (photo) => {
                        const filePath = path.join(facilityPhotosDir, photo.fileName);
                        if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
                            await vercelUpload(
                                photoBlobPath(entry.slug, photo.fileName, photoFolder),
                                fs.readFileSync(filePath),
                            );
                        }
                    }),
                );
            }
        } catch (error) {
            console.error(`  Upsert failed: ${facilityData.name}`, error);
        }
    }

    console.log(
        `\nDone: ${upsertedCount} / ${facilities.length} facilities upserted from "${sheetName}"`,
    );
}

// --- Entry point ---

async function main() {
    const args = process.argv.slice(2);
    const sheetName = args.find((arg) => arg !== "--dev");
    const photoFolder = args.includes("--dev") ? DEV_PHOTO_FOLDER : "";
    if (!sheetName) {
        console.log("Usage:   npx tsx scripts/syncFacilities.ts <sheet-name> [--dev]");
        console.log('Example: npx tsx scripts/syncFacilities.ts "Central Province"');
        process.exit(1);
    }

    config();
    console.log(`Connecting to: ${process.env.DATABASE_URL}`);

    try {
        console.log(`Photo folder: ${photoFolder || "production"}`);
        await syncSheet(sheetName, photoFolder);
    } finally {
        await prisma.$disconnect();
    }
}

main();
