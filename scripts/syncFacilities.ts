/**
 * syncFacilities.ts
 *
 * Pulls children's home data from a Google Sheet tab, downloads photos,
 * upserts facilities into the database, and uploads photos to Vercel Blob.
 *
 * Usage:   npx tsx scripts/syncFacilities.ts <sheet-name>
 * Example: npx tsx scripts/syncFacilities.ts "Central Province"
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { google } from "googleapis";
import { put, list } from "@vercel/blob";
import { config } from "dotenv";
import { Gender, PrismaClient } from "@prisma/client";

const SCRIPTS_DIR = __dirname;
const PHOTOS_DIR = path.join(SCRIPTS_DIR, "data", "photos");
const CREDENTIALS_FILE = path.join(SCRIPTS_DIR, "google-api-key.json");
const CONFIG_FILE = path.join(SCRIPTS_DIR, "config.json");

const { "google-sheet-id": SHEET_ID } = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
const GOOGLE_CREDENTIALS = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, "utf-8"));

const prisma = new PrismaClient();

// --- Image helpers ---

function detectImageType(buffer: Buffer): string | null {
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return "jpg";
    }
    if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
    ) {
        return "png";
    }
    if (
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50
    ) {
        return "webp";
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        return "gif";
    }
    return null;
}

function fileTypeFromUrl(url: string): string | null {
    const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
    if (ext === "jpeg") {
        return "jpg";
    }
    if (ext && ["jpg", "png", "webp", "gif"].includes(ext)) {
        return ext;
    }
    return null;
}

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

// --- Coordinate extraction ---

async function extractLatLng(
    url: string,
): Promise<{ latitude: number; longitude: number } | null> {
    let resolvedUrl = url;

    if (url.includes("maps.app.goo.gl")) {
        try {
            const resp = await fetch(url, { redirect: "follow" });
            resolvedUrl = resp.url;
        } catch {
            return null;
        }
    }

    // Pattern: /@lat,lng,zoom  (e.g. google.com/maps/place/.../@7.2906,80.6337,17z)
    const atMatch = resolvedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
        return { latitude: parseFloat(atMatch[1]), longitude: parseFloat(atMatch[2]) };
    }

    // Pattern: ?q=lat,lng  (e.g. maps.google.com/maps?q=7.2906,80.6337)
    const qMatch = resolvedUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
        return { latitude: parseFloat(qMatch[1]), longitude: parseFloat(qMatch[2]) };
    }

    return null;
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

// --- Data transformation ---

async function parseRow(row: Record<string, string>) {
    if (!row["Slug"]?.trim()) {
        return null;
    }

    const gender = row["Accepted Genders"]?.trim() ?? "";
    if (!["Male", "Female", "Both", ""].includes(gender)) {
        throw new Error(`Invalid gender: "${gender}" | ${row["Name"]}`);
    }

    const phones = row["Phone Numbers"]
        ? row["Phone Numbers"].split(",").map((p) => p.trim()).filter(Boolean)
        : [];
    for (const phone of phones) {
        if (!phone.startsWith("0") || phone.length !== 10) {
            throw new Error(`Invalid phone: "${phone}" | ${row["Name"]}`);
        }
    }

    const emails = row["Email Addresses"]
        ? row["Email Addresses"].split(",").map((e) => e.trim()).filter(Boolean)
        : [];
    for (const email of emails) {
        if (!email.includes("@")) {
            throw new Error(`Invalid email: "${email}" | ${row["Name"]}`);
        }
    }

    const googleUrl = row["Google Maps"]?.trim().replace(/^\/|\/$/g, "") ?? "";
    const coords = googleUrl ? await extractLatLng(googleUrl) : null;

    return {
        name: row["Name"].trim(),
        slug: row["Slug"].trim(),
        type: row["Type"]?.trim() || "Voluntary Children's Home",
        managedBy: row["Managed By"]?.trim() ?? "",
        description: row["Description"]?.trim() ?? "",
        location: {
            address: row["Address"]?.trim() ?? "",
            city: row["City"]?.trim() ?? "",
            district: row["District"]?.trim() ?? "",
            province: row["Province"]?.trim() ?? "",
            divisionalSecretariat: row["Divisional Secretariat"]?.trim() ?? "",
            google: googleUrl,
            latitude: coords?.latitude ?? null,
            longitude: coords?.longitude ?? null,
        },
        contact: {
            phone: phones,
            email: emails,
            website: row["Website"]?.trim().replace(/[/ ]+$/, "") ?? "",
            facebook: row["Facebook"]?.trim().replace(/[/ ]+$/, "") ?? "",
            instagram: row["Instagram"]?.trim().replace(/[/ ]+$/, "") ?? "",
        },
        genders: (gender.toLowerCase() || "unknown") as Gender,
        occupancy: {
            total: row["Count - Total"] ? parseInt(row["Count - Total"]) : null,
            male: row["Count - Male"] ? parseInt(row["Count - Male"]) : null,
            female: row["Count - Female"] ? parseInt(row["Count - Female"]) : null,
        },
        ageRanges: {
            all: row["Age Range - All"]?.trim() ?? "",
            male: row["Age Range - Male"]?.trim() ?? "",
            female: row["Age Range - Female"]?.trim() ?? "",
        },
        photoUrls: row["Photos"]
            ? row["Photos"].split("|").map((u) => u.trim()).filter(Boolean)
            : [],
        sources: row["Sources"]
            ? row["Sources"].split("|").map((s) => s.trim()).filter(Boolean)
            : [],
    };
}

// --- Vercel Blob upload ---

async function vercelUpload(
    slug: string,
    vercelPath: string,
    fileBuffer: Buffer,
): Promise<void> {
    const blobs = await list({ prefix: slug, token: process.env.VERCEL_TOKEN });
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

async function syncSheet(sheetName: string) {
    console.log(`\nPulling data from sheet: "${sheetName}"`);
    const rows = await pullFromSheet(sheetName);

    const facilities = (await Promise.all(rows.map(parseRow))).filter(Boolean) as NonNullable<
        Awaited<ReturnType<typeof parseRow>>
    >[];
    console.log(`  ${facilities.length} valid facilities found`);

    let upsertedCount = 0;

    for (const facility of facilities) {
        const { photoUrls, ...facilityData } = facility;

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
            const entry = await prisma.childCareFacility.upsert({
                where: { slug: facilityData.slug },
                create: { ...facilityData, photos },
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
                    photos,
                    sources: facilityData.sources,
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
                                entry.slug,
                                `${entry.slug}/${photo.fileName}`,
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

async function main() {
    const sheetName = process.argv[2];
    if (!sheetName) {
        console.log("Usage:   npx tsx scripts/syncFacilities.ts <sheet-name>");
        console.log('Example: npx tsx scripts/syncFacilities.ts "Central Province"');
        process.exit(1);
    }

    config();
    console.log(`Connecting to: ${process.env.DATABASE_URL}`);

    try {
        await syncSheet(sheetName);
    } finally {
        await prisma.$disconnect();
    }
}

main();
