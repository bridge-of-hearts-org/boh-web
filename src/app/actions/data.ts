"use server";

import {
    ChildCareFacilityInput,
    DirectoryFilterType,
    FacilityPin,
} from "@/utils/defines";
import { ChildCareFacility, Prisma } from "@prisma/client";
import { config } from "dotenv";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { BlobNotFoundError, del, head } from "@vercel/blob";
import { parseItemsPerPage, parsePage } from "@/utils/pagination";
import { abortAfter } from "@/utils/utils";

import { prisma } from "@/utils/db";
import { getServerAuth } from "@/lib/auth";
import {
    extractLatLng,
    buildOpenInMapsUrl,
    hasCoordinates,
    isGoogleMapsUrl,
    LatLng,
} from "@/utils/maps";
import {
    contentTypeForFileName,
    isValidPhotoFileName,
    isValidSlug,
    isDeletablePhotoFileName,
    MAX_PHOTO_SIZE_BYTES,
    MAX_PHOTOS_PER_DELETE,
    photoBlobPath,
    photosToDelete,
    photoUrl,
} from "@/utils/photos";
import { normalizeVerification } from "@/utils/verification";
import { describeFacilityWriteError } from "@/utils/dbErrors";
import {
    localizeFacility,
    parseLocale,
    TranslatedField,
    translatedField,
    translatedLocales,
} from "@/utils/facilityTranslations";

/* Server actions are public POST endpoints, so every write action must check
   for an admin session itself instead of relying on the page being gated */
const UNAUTHORIZED = "Unauthorized: admin login required";
const INVALID_SLUG =
    "The slug may only contain lowercase letters, numbers and hyphens";

/* How long createPhotoUploadToken waits to learn whether a photo is stored */
const PHOTO_CHECK_TIMEOUT_MS = 5000;

/* The sync script calls the Blob read-write token VERCEL_TOKEN */
const getBlobToken = (): string | undefined =>
    process.env.BLOB_READ_WRITE_TOKEN ?? process.env.VERCEL_TOKEN;

type FilteredFacilityResponse = Promise<
    [data: ChildCareFacility[], totalCount: number]
>;

/* Matches the search text in the English value or in any translation, so
   a search works in either language whichever page it's made on */
function matchAnyLanguage(
    field: TranslatedField,
    english: Prisma.ChildCareFacilityWhereInput,
    search: string,
): Prisma.ChildCareFacilityWhereInput {
    const condition = { contains: search, mode: "insensitive" as const };

    return {
        OR: [
            english,
            ...translatedLocales.map((locale) => ({
                translations: {
                    is: { [locale]: { is: { [field]: condition } } },
                },
            })),
        ],
    };
}

function buildFilter(
    filterValues: DirectoryFilterType,
): Prisma.ChildCareFacilityWhereInput[] {
    const filters: Prisma.ChildCareFacilityWhereInput[] = [];

    if (filterValues.name) {
        filters.push(
            matchAnyLanguage(
                "name",
                {
                    name: {
                        contains: filterValues.name,
                        mode: "insensitive",
                    },
                },
                filterValues.name,
            ),
        );
    }

    if (filterValues.city) {
        filters.push(
            matchAnyLanguage(
                "city",
                {
                    location: {
                        is: {
                            city: {
                                contains: filterValues.city,
                                mode: "insensitive",
                            },
                        },
                    },
                },
                filterValues.city,
            ),
        );
    }

    if (filterValues.managedBy) {
        filters.push(
            matchAnyLanguage(
                "managedBy",
                {
                    managedBy: {
                        contains: filterValues.managedBy,
                        mode: "insensitive",
                    },
                },
                filterValues.managedBy,
            ),
        );
    }

    if (filterValues.district) {
        filters.push({
            location: {
                is: {
                    district: {
                        equals: filterValues.district,
                        mode: "insensitive",
                    },
                },
            },
        });
    }

    if (filterValues.province) {
        filters.push({
            location: {
                is: {
                    province: {
                        equals: filterValues.province,
                        mode: "insensitive",
                    },
                },
            },
        });
    }

    return filters;
}

/* The read actions below return facility text in the given language,
   falling back to English per field where a translation is missing */
export async function fetchAllFacilities(
    filterValues: DirectoryFilterType,
    sortBy: string,
    page: number,
    itemsPerPage: number,
    locale?: string,
): FilteredFacilityResponse {
    /* Reload .env */
    if (process.env.NODE_ENV === "development") {
        config({
            override: true,
        });
        console.log(`Connecting to database: ${process.env.DATABASE_URL}`);
    }

    const getOrderBy = (): Prisma.ChildCareFacilityOrderByWithRelationInput => {
        if (sortBy == "city") {
            return {
                location: {
                    city: "asc",
                },
            };
        } else {
            // Order by name by default
            return {
                name: "asc",
            };
        }
    };

    /* Server actions are public endpoints, so don't trust the paging arguments */
    const safePage = parsePage(page);
    const safeItemsPerPage = parseItemsPerPage(itemsPerPage);

    try {
        const [facilities, totalCount] = await prisma.$transaction([
            prisma.childCareFacility.findMany({
                where: {
                    AND: buildFilter(filterValues),
                },
                take: safeItemsPerPage,
                skip: (safePage - 1) * safeItemsPerPage,
                orderBy: getOrderBy(),
            }),
            prisma.childCareFacility.count({
                where: {
                    AND: buildFilter(filterValues),
                },
            }),
        ]);

        const language = parseLocale(locale);

        return [
            facilities.map((facility) => localizeFacility(facility, language)),
            totalCount,
        ];
    } catch (error) {
        if (error instanceof Error) {
            console.log("Error: ", error.stack);
        }
        return [[], 0];
    }
}

/* Map pins for every facility matching the filter, not just the current page */
export async function fetchFacilityPins(
    filterValues: DirectoryFilterType,
    locale?: string,
): Promise<FacilityPin[]> {
    const language = parseLocale(locale);

    try {
        const facilities = await prisma.childCareFacility.findMany({
            where: {
                AND: buildFilter(filterValues),
            },
            select: {
                name: true,
                slug: true,
                translations: true,
                location: {
                    select: {
                        city: true,
                        google: true,
                        latitude: true,
                        longitude: true,
                    },
                },
            },
        });

        return facilities.flatMap((f) => {
            const mapsUrl = buildOpenInMapsUrl(f.location);
            if (!hasCoordinates(f.location) || !mapsUrl) {
                return [];
            }

            return [
                {
                    name: translatedField(
                        f.translations,
                        language,
                        "name",
                        f.name,
                    ),
                    slug: f.slug,
                    city: translatedField(
                        f.translations,
                        language,
                        "city",
                        f.location.city,
                    ),
                    lat: f.location.latitude,
                    lng: f.location.longitude,
                    mapsUrl,
                },
            ];
        });
    } catch (error) {
        if (error instanceof Error) {
            console.log("Error: ", error.stack);
        }
        return [];
    }
}

export async function fetchDistinctCities(locale?: string): Promise<string[]> {
    const language = parseLocale(locale);

    try {
        const rows = await prisma.childCareFacility.findMany({
            select: {
                location: { select: { city: true } },
                translations: true,
            },
        });
        const cities = rows.map((r) =>
            translatedField(r.translations, language, "city", r.location.city),
        );
        return [...new Set(cities)].sort();
    } catch {
        return [];
    }
}

export async function fetchFacilityNames(locale?: string): Promise<string[]> {
    const language = parseLocale(locale);

    try {
        const rows = await prisma.childCareFacility.findMany({
            select: { name: true, translations: true },
        });
        return rows
            .map((r) =>
                translatedField(r.translations, language, "name", r.name),
            )
            .sort((a, b) => a.localeCompare(b));
    } catch (error) {
        if (error instanceof Error) {
            console.log("Error: ", error.stack);
        }
        return [];
    }
}

export async function fetchDistinctManagedBy(
    locale?: string,
): Promise<string[]> {
    const language = parseLocale(locale);

    try {
        const rows = await prisma.childCareFacility.findMany({
            select: { managedBy: true, translations: true },
        });
        const values = rows
            .map((r) =>
                translatedField(
                    r.translations,
                    language,
                    "managedBy",
                    r.managedBy,
                ).trim(),
            )
            .filter((m) => m !== "");
        return [...new Set(values)].sort((a, b) => a.localeCompare(b));
    } catch (error) {
        if (error instanceof Error) {
            console.log("Error: ", error.stack);
        }
        return [];
    }
}

/* Without a locale this returns the facility as stored, in English with its
   translations, as the admin edit form needs it */
export async function fetchFacilityBySlug(slug: string, locale?: string) {
    let data = null;

    try {
        data = await prisma.childCareFacility.findUnique({
            where: { slug: slug },
        });
    } catch {}

    return data ? localizeFacility(data, parseLocale(locale)) : null;
}

export async function updateFacility(
    data: ChildCareFacilityInput,
): Promise<string> {
    if (!(await getServerAuth())) {
        return UNAUTHORIZED;
    }

    try {
        await prisma.childCareFacility.update({
            where: {
                slug: data.slug,
            },
            data: {
                ...data,
                verification: normalizeVerification(data),
            },
        });
    } catch (error) {
        console.log("Ran into prisma error", error);
        return describeFacilityWriteError(error);
    }

    return "success";
}

export async function addFacility(
    data: ChildCareFacilityInput,
): Promise<string> {
    if (!(await getServerAuth())) {
        return UNAUTHORIZED;
    }

    try {
        await prisma.childCareFacility.create({
            data: {
                ...data,
                verification: normalizeVerification(data),
            },
        });
    } catch (error) {
        console.log("Ran into prisma error", error);
        return describeFacilityWriteError(error);
    }

    return "success";
}

export async function resolveLatLng(
    url: string,
): Promise<(LatLng & { resolvedUrl: string }) | { error: string }> {
    /* This fetches arbitrary URLs server-side, so restrict it to admins and Google Maps hosts */
    if (!(await getServerAuth())) {
        return { error: UNAUTHORIZED };
    }

    if (typeof url !== "string" || !isGoogleMapsUrl(url)) {
        return { error: "Not a Google Maps URL" };
    }

    const coords = await extractLatLng(url.trim());
    if (!coords) {
        return {
            error: "Couldn't find coordinates in this URL. Enter them manually.",
        };
    }

    return coords;
}

/* Issues a short-lived token that lets the browser upload one photo straight
   to Vercel Blob, so the file never passes through this server's request size
   limit. The token only allows the given path, content type and size.
   Photos are named after their contents, so if the photo is already stored
   it returns `exists` instead, and the form reuses the stored photo. */
export async function createPhotoUploadToken(
    slug: string,
    fileName: string,
): Promise<{ token: string } | { exists: true } | { error: string }> {
    if (!(await getServerAuth())) {
        return { error: UNAUTHORIZED };
    }

    if (typeof slug !== "string" || !isValidSlug(slug)) {
        return { error: INVALID_SLUG };
    }

    const contentType =
        typeof fileName === "string" && isValidPhotoFileName(fileName)
            ? contentTypeForFileName(fileName)
            : null;
    if (!contentType) {
        return { error: "Invalid photo file name" };
    }

    const blobToken = getBlobToken();
    if (!blobToken) {
        return { error: "Photo storage is not configured on this server" };
    }

    /* The SDK retries a failing API for minutes; don't hold up the upload
       that long when the check can't be made */
    const timeout = abortAfter(PHOTO_CHECK_TIMEOUT_MS);
    try {
        await head(photoUrl(slug, fileName), {
            token: blobToken,
            abortSignal: timeout.signal,
        });
        return { exists: true };
    } catch (error) {
        /* If the check itself failed, try the upload anyway */
        if (!(error instanceof BlobNotFoundError)) {
            console.log("Couldn't check whether the photo is stored", error);
        }
    } finally {
        timeout.cancel();
    }

    try {
        const token = await generateClientTokenFromReadWriteToken({
            token: blobToken,
            pathname: photoBlobPath(slug, fileName),
            allowedContentTypes: [contentType],
            maximumSizeInBytes: MAX_PHOTO_SIZE_BYTES,
            addRandomSuffix: false,
            validUntil: Date.now() + 5 * 60 * 1000,
        });

        return { token };
    } catch (error) {
        console.log("Couldn't create a photo upload token", error);
        return { error: "Couldn't start the upload" };
    }
}

/* Deletes photos the admin form uploaded or removed and no longer needs from
   Vercel Blob. Photos the facility saved under `slug` still lists, including
   ones added by the sheet sync, are never deleted, whatever the form sends. */
export async function deleteUnusedPhotos(
    slug: string,
    fileNames: string[],
): Promise<{ deleted: string[] } | { error: string }> {
    if (!(await getServerAuth())) {
        return { error: UNAUTHORIZED };
    }

    if (typeof slug !== "string" || !isValidSlug(slug)) {
        return { error: INVALID_SLUG };
    }

    if (!Array.isArray(fileNames) || fileNames.length > MAX_PHOTOS_PER_DELETE) {
        return { error: "Invalid photo file names" };
    }

    /* Skip names that can't be a stored photo rather than refuse the rest */
    const validNames = fileNames.filter(isDeletablePhotoFileName);
    if (validNames.length < fileNames.length) {
        console.log(
            "Skipped invalid photo file names",
            fileNames.filter((f) => !isDeletablePhotoFileName(f)),
        );
    }

    const blobToken = getBlobToken();
    if (!blobToken) {
        return { error: "Photo storage is not configured on this server" };
    }

    let inUse: string[];
    try {
        const facility = await prisma.childCareFacility.findUnique({
            where: { slug: slug },
            select: { photos: true },
        });
        inUse = facility?.photos.map((p) => p.fileName) ?? [];
    } catch (error) {
        console.log("Couldn't look up the facility's photos", error);
        return { error: "Couldn't check which photos are in use" };
    }

    const toDelete =
        photosToDelete(
            validNames.map((fileName) => ({ slug, fileName })),
            inUse.map((fileName) => ({ slug, fileName })),
        )[slug] ?? [];

    if (toDelete.length === 0) {
        return { deleted: [] };
    }

    try {
        await del(
            toDelete.map((fileName) => photoUrl(slug, fileName)),
            { token: blobToken },
        );
    } catch (error) {
        console.log("Couldn't delete photos", error);
        return { error: "Couldn't delete the photos" };
    }

    return { deleted: toDelete };
}
