/**
 * syncHelpers.ts
 *
 * Pure helpers for syncFacilities.ts, kept separate so they can be unit tested
 * without the script's config and credential files.
 */

import {
    ChildCareFacility,
    Gender,
    Verification,
    VerifiedValue,
} from "@prisma/client";

import { extractLatLng } from "../src/utils/maps";
import {
    emptyVerification,
    normalizeVerification,
    parseVerifiedDate,
    findVerifiedDate,
    setVerifiedDate,
    verifyOccupancy,
} from "../src/utils/verification";

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

// --- Verification columns ---

/* Parses a "value=YYYY-MM-DD, value=YYYY-MM-DD" cell. Entries for values that
   aren't listed, or with a bad date, are skipped with a warning. */
export function parseVerifiedEntries(
    cell: string | undefined,
    listed: string[],
    column: string,
    facilityName: string,
): { entries: VerifiedValue[]; warnings: string[] } {
    const entries: VerifiedValue[] = [];
    const warnings: string[] = [];

    const items = (cell ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    for (const item of items) {
        const separator = item.lastIndexOf("=");
        const value = separator === -1 ? item : item.slice(0, separator).trim();
        const date =
            separator === -1
                ? null
                : parseVerifiedDate(item.slice(separator + 1));

        if (!date) {
            warnings.push(
                `${column}: "${item}" needs a date as value=YYYY-MM-DD, skipped | ${facilityName}`,
            );
        } else if (!listed.includes(value)) {
            warnings.push(
                `${column}: "${value}" isn't listed in the facility's values, skipped | ${facilityName}`,
            );
        } else {
            entries.push({ value: value, verifiedAt: date });
        }
    }

    return { entries, warnings };
}

/* The verifications read from one sheet row, before they're merged with the saved ones */
export type SheetVerification = {
    phones: VerifiedValue[];
    emails: VerifiedValue[];
    occupancy: Date | null;
};

/* True when the sheet's date should replace the saved one. An older date
   would undo a later verification, e.g. one an admin entered on the site. */
function isNewerDate(date: Date, saved: Date | null): boolean {
    return !saved || date.getTime() > new Date(saved).getTime();
}

/* Applies the sheet's verifications on top of the saved ones. The sheet only
   adds or updates verifications with newer dates; an empty cell never removes
   one. Verifications for phone numbers and emails the sheet no longer lists
   are dropped. */
export function mergeSheetVerification(
    sheet: SheetVerification,
    values: Pick<ChildCareFacility, "contact" | "occupancy">,
    existing: Pick<ChildCareFacility, "verification"> | null,
): Verification | null {
    const merged = { ...(existing?.verification ?? emptyVerification) };

    for (const entry of sheet.phones) {
        const saved = findVerifiedDate(merged.phones, entry.value);
        if (isNewerDate(entry.verifiedAt, saved)) {
            merged.phones = setVerifiedDate(
                merged.phones,
                entry.value,
                entry.verifiedAt,
            );
        }
    }
    for (const entry of sheet.emails) {
        const saved = findVerifiedDate(merged.emails, entry.value);
        if (isNewerDate(entry.verifiedAt, saved)) {
            merged.emails = setVerifiedDate(
                merged.emails,
                entry.value,
                entry.verifiedAt,
            );
        }
    }

    /* Only a newer date verifies the current counts. The same or an older
        date with different counts means the counts were changed without being
        verified again, so the saved verification stays and isn't shown. */
    const saved = merged.occupancy?.verifiedAt ?? null;
    if (sheet.occupancy && isNewerDate(sheet.occupancy, saved)) {
        merged.occupancy = verifyOccupancy(values.occupancy, sheet.occupancy);
    }

    return normalizeVerification({
        contact: values.contact,
        verification: merged,
    });
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
        ? row["Phone Numbers"]
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean)
        : [];
    for (const phone of phones) {
        if (!phone.startsWith("0") || phone.length !== 10) {
            throw new Error(`Invalid phone: "${phone}" | ${row["Name"]}`);
        }
    }

    const emails = row["Email Addresses"]
        ? row["Email Addresses"]
              .split(",")
              .map((e) => e.trim())
              .filter(Boolean)
        : [];
    for (const email of emails) {
        if (!email.includes("@")) {
            throw new Error(`Invalid email: "${email}" | ${row["Name"]}`);
        }
    }

    const facilityName = row["Name"]?.trim() ?? "";
    const verifiedPhones = parseVerifiedEntries(
        row["Phone Numbers - Verified"],
        phones,
        "Phone Numbers - Verified",
        facilityName,
    );
    const verifiedEmails = parseVerifiedEntries(
        row["Email Addresses - Verified"],
        emails,
        "Email Addresses - Verified",
        facilityName,
    );
    const warnings = [...verifiedPhones.warnings, ...verifiedEmails.warnings];

    const occupancyCell = row["Count - Verified On"]?.trim() ?? "";
    const occupancyVerifiedAt = occupancyCell
        ? parseVerifiedDate(occupancyCell)
        : null;
    if (occupancyCell && !occupancyVerifiedAt) {
        warnings.push(
            `Count - Verified On: "${occupancyCell}" isn't a YYYY-MM-DD date, skipped | ${facilityName}`,
        );
    }

    const sheetVerification: SheetVerification = {
        phones: verifiedPhones.entries,
        emails: verifiedEmails.entries,
        occupancy: occupancyVerifiedAt,
    };

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
            female: row["Count - Female"]
                ? parseInt(row["Count - Female"])
                : null,
        },
        ageRanges: {
            all: row["Age Range - All"]?.trim() ?? "",
            male: row["Age Range - Male"]?.trim() ?? "",
            female: row["Age Range - Female"]?.trim() ?? "",
        },
        photoUrls: row["Photos"]
            ? row["Photos"]
                  .split("|")
                  .map((u) => u.trim())
                  .filter(Boolean)
            : [],
        sources: row["Sources"]
            ? row["Sources"]
                  .split("|")
                  .map((s) => s.trim())
                  .filter(Boolean)
            : [],
        /* Merged with the saved verification by mergeSheetVerification, not written as is */
        sheetVerification: sheetVerification,
        warnings: warnings,
    };
}
