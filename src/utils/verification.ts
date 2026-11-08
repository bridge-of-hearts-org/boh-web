/* Per-field verification: phone numbers, emails and occupancy counts that were
   confirmed by contacting the facility directly, each with its own date.
   Each verification is tied to the value that was confirmed, so a value that
   changes afterwards isn't shown as verified. */

import { Locale, sinhalaMonths } from "@/utils/locale";
import {
    ChildCareFacility,
    Verification,
    VerifiedAgeRanges,
    VerifiedOccupancy,
    VerifiedValue,
} from "@prisma/client";

type Occupancy = ChildCareFacility["occupancy"];
type AgeRanges = ChildCareFacility["ageRanges"];

export const emptyVerification: Verification = {
    phones: [],
    emails: [],
    occupancy: null,
    ageRanges: null,
};

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/* Parses a YYYY-MM-DD date as midnight UTC, or null if it isn't a real date */
export function parseVerifiedDate(text: string): Date | null {
    const match = DATE_PATTERN.exec(text.trim());
    if (!match) {
        return null;
    }

    const [year, month, day] = match.slice(1).map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    /* Rejects dates like 2026-02-30, which Date would roll over into March */
    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }

    return date;
}

/* The YYYY-MM-DD value for a date input, or "" for no date */
export function toDateInputValue(date: Date | null | undefined): string {
    return isValidDate(date) ? new Date(date).toISOString().slice(0, 10) : "";
}

/* Dates are stored as midnight UTC, so they're shown in UTC to keep the same
   day, e.g. "12 March 2026" or "2026 මාර්තු 12" */
export function formatVerifiedDate(date: Date, locale: Locale = "en"): string {
    const d = new Date(date);

    if (locale === "si") {
        return `${d.getUTCFullYear()} ${sinhalaMonths[d.getUTCMonth()]} ${d.getUTCDate()}`;
    }

    return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
}

/* Server action arguments come from the browser, so dates may also arrive as strings */
function isValidDate(date: unknown): date is Date {
    if (!(date instanceof Date) && typeof date !== "string") {
        return false;
    }

    return date !== "" && !isNaN(new Date(date).getTime());
}

/* The form stores an empty count as 0 and the sheet as null; both mean "no count" */
export function sameOccupancy(a: Occupancy, b: Occupancy): boolean {
    return (
        (a.total || 0) === (b.total || 0) &&
        (a.male || 0) === (b.male || 0) &&
        (a.female || 0) === (b.female || 0)
    );
}

/* The form stores an empty age range as "" and the sheet may leave it null;
   both mean "no age range" */
export function sameAgeRanges(a: AgeRanges, b: AgeRanges): boolean {
    return (
        (a.all ?? "").trim() === (b.all ?? "").trim() &&
        (a.male ?? "").trim() === (b.male ?? "").trim() &&
        (a.female ?? "").trim() === (b.female ?? "").trim()
    );
}

/* ----------- Phone numbers and emails ----------- */

export function findVerifiedDate(
    list: VerifiedValue[] | undefined,
    value: string,
): Date | null {
    return list?.find((entry) => entry.value === value)?.verifiedAt ?? null;
}

/* Sets the verification date for one value, or removes it when date is null */
export function setVerifiedDate(
    list: VerifiedValue[],
    value: string,
    date: Date | null,
): VerifiedValue[] {
    const others = list.filter((entry) => entry.value !== value);
    if (!date) {
        return others;
    }

    return [...others, { value: value, verifiedAt: date }];
}

/* ----------- Occupancy ----------- */

/* The date the current counts were verified, or null if they weren't */
export function findOccupancyVerifiedDate(
    occupancy: Occupancy,
    verification: Verification | null,
): Date | null {
    const verified = verification?.occupancy;
    if (!verified || !sameOccupancy(verified, occupancy)) {
        return null;
    }

    return verified.verifiedAt;
}

/* Marks the current counts as verified on date, or removes the verification when date is null */
export function verifyOccupancy(
    occupancy: Occupancy,
    date: Date | null,
): VerifiedOccupancy | null {
    if (!date) {
        return null;
    }

    return {
        total: occupancy.total || null,
        male: occupancy.male || null,
        female: occupancy.female || null,
        verifiedAt: date,
    };
}

/* What's left when the occupancy date is cleared. A saved verification for
   other counts is kept: it isn't shown, but it stops a sheet that still has
   its date from marking the current counts as verified. */
export function clearOccupancyVerification(
    occupancy: Occupancy,
    saved: VerifiedOccupancy | null | undefined,
): VerifiedOccupancy | null {
    if (saved && !sameOccupancy(saved, occupancy)) {
        return saved;
    }

    return null;
}

/* ----------- Age ranges ----------- */

/* The date the current age ranges were verified, or null if they weren't */
export function findAgeRangesVerifiedDate(
    ageRanges: AgeRanges,
    verification: Verification | null,
): Date | null {
    const verified = verification?.ageRanges;
    if (!verified || !sameAgeRanges(verified, ageRanges)) {
        return null;
    }

    return verified.verifiedAt;
}

/* Marks the current age ranges as verified on date, or removes the verification when date is null */
export function verifyAgeRanges(
    ageRanges: AgeRanges,
    date: Date | null,
): VerifiedAgeRanges | null {
    if (!date) {
        return null;
    }

    return {
        all: ageRanges.all?.trim() || null,
        male: ageRanges.male?.trim() || null,
        female: ageRanges.female?.trim() || null,
        verifiedAt: date,
    };
}

/* What's left when the age ranges date is cleared; see clearOccupancyVerification */
export function clearAgeRangesVerification(
    ageRanges: AgeRanges,
    saved: VerifiedAgeRanges | null | undefined,
): VerifiedAgeRanges | null {
    if (saved && !sameAgeRanges(saved, ageRanges)) {
        return saved;
    }

    return null;
}

/* ----------- Saving ----------- */

/* Keeps one verification per listed value and drops the rest */
function pruneValues(
    list: VerifiedValue[] | undefined,
    listed: string[],
): VerifiedValue[] {
    const byValue = new Map<string, VerifiedValue>();
    for (const entry of list ?? []) {
        if (listed.includes(entry.value) && isValidDate(entry.verifiedAt)) {
            byValue.set(entry.value, {
                value: entry.value,
                verifiedAt: new Date(entry.verifiedAt),
            });
        }
    }

    return Array.from(byValue.values());
}

function cleanOccupancy(
    verified: VerifiedOccupancy | null | undefined,
): VerifiedOccupancy | null {
    if (!verified || !isValidDate(verified.verifiedAt)) {
        return null;
    }

    return verifyOccupancy(verified, new Date(verified.verifiedAt));
}

function cleanAgeRanges(
    verified: VerifiedAgeRanges | null | undefined,
): VerifiedAgeRanges | null {
    if (!verified || !isValidDate(verified.verifiedAt)) {
        return null;
    }

    return verifyAgeRanges(verified, new Date(verified.verifiedAt));
}

/* Cleans up a facility's verification before it's saved: drops phone and email
   verifications for values that aren't listed, and invalid dates. Returns null
   when nothing is verified. An occupancy or age ranges verification for values
   that have since changed is kept but not shown, so it can't come back on its
   own. */
export function normalizeVerification(
    facility: Pick<ChildCareFacility, "contact" | "verification">,
): Verification | null {
    const verification = facility.verification;

    const normalized: Verification = {
        phones: pruneValues(verification?.phones, facility.contact.phone),
        emails: pruneValues(verification?.emails, facility.contact.email),
        occupancy: cleanOccupancy(verification?.occupancy),
        ageRanges: cleanAgeRanges(verification?.ageRanges),
    };

    if (
        normalized.phones.length === 0 &&
        normalized.emails.length === 0 &&
        !normalized.occupancy &&
        !normalized.ageRanges
    ) {
        return null;
    }

    return normalized;
}
