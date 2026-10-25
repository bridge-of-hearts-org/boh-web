/**
 * syncHelpers.ts
 *
 * Pure helpers for syncFacilities.ts, kept separate so they can be unit tested
 * without the script's config and credential files.
 */

import { Gender } from "@prisma/client";

import { extractLatLng } from "../src/utils/maps";

// --- Image helpers ---

export function detectImageType(buffer: Buffer): string | null {
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

export function fileTypeFromUrl(url: string): string | null {
    const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
    if (ext === "jpeg") {
        return "jpg";
    }
    if (ext && ["jpg", "png", "webp", "gif"].includes(ext)) {
        return ext;
    }
    return null;
}

// --- Data transformation ---

export async function parseRow(row: Record<string, string>) {
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
            google: coords?.resolvedUrl ?? googleUrl,
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
