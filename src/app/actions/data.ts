"use server";

import {
    ChildCareFacilityInput,
    DirectoryFilterType,
    FacilityPin,
    vercelStorageUrl,
} from "@/utils/defines";
import { ChildCareFacility, Prisma } from "@prisma/client";
import { config } from "dotenv";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { del } from "@vercel/blob";

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
    photosToDelete,
} from "@/utils/photos";
import { describeFacilityWriteError } from "@/utils/dbErrors";

/* Server actions are public POST endpoints, so every write action must check
   for an admin session itself instead of relying on the page being gated */
const UNAUTHORIZED = "Unauthorized: admin login required";
const INVALID_SLUG =
    "The slug may only contain lowercase letters, numbers and hyphens";

/* The sync script calls the Blob read-write token VERCEL_TOKEN */
const getBlobToken = (): string | undefined =>
    process.env.BLOB_READ_WRITE_TOKEN ?? process.env.VERCEL_TOKEN;

type FilteredFacilityResponse = Promise<
    [data: ChildCareFacility[], totalCount: number]
>;

function buildFilter(
    filterValues: DirectoryFilterType,
): Prisma.ChildCareFacilityWhereInput[] {
    const filters: Prisma.ChildCareFacilityWhereInput[] = [];

    if (filterValues.name) {
        filters.push({
            name: {
                contains: filterValues.name,
                mode: "insensitive",
            },
        });
    }

    if (filterValues.city) {
        filters.push({
            location: {
                is: {
                    city: {
                        contains: filterValues.city,
                        mode: "insensitive",
                    },
                },
            },
        });
    }

    if (filterValues.managedBy) {
        filters.push({
            managedBy: {
                contains: filterValues.managedBy,
                mode: "insensitive",
            },
        });
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

export async function fetchAllFacilities(
    filterValues: DirectoryFilterType,
    sortBy: string,
    page: number,
    itemsPerPage: number,
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

    try {
        const [facilities, totalCount] = await prisma.$transaction([
            prisma.childCareFacility.findMany({
                where: {
                    AND: buildFilter(filterValues),
                },
                take: itemsPerPage,
                skip: (page - 1) * itemsPerPage,
                orderBy: getOrderBy(),
            }),
            prisma.childCareFacility.count({
                where: {
                    AND: buildFilter(filterValues),
                },
            }),
        ]);

        return [facilities, totalCount];
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
): Promise<FacilityPin[]> {
    try {
        const facilities = await prisma.childCareFacility.findMany({
            where: {
                AND: buildFilter(filterValues),
            },
            select: {
                name: true,
                slug: true,
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
                    name: f.name,
                    slug: f.slug,
                    city: f.location.city,
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

export async function fetchDistinctCities(): Promise<string[]> {
    try {
        const rows = await prisma.childCareFacility.findMany({
            select: { location: { select: { city: true } } },
        });
        return [...new Set(rows.map((r) => r.location.city))].sort();
    } catch {
        return [];
    }
}

export async function fetchFacilityNames(): Promise<string[]> {
    try {
        const rows = await prisma.childCareFacility.findMany({
            select: { name: true },
        });
        return rows.map((r) => r.name).sort((a, b) => a.localeCompare(b));
    } catch (error) {
        if (error instanceof Error) {
            console.log("Error: ", error.stack);
        }
        return [];
    }
}

export async function fetchDistinctManagedBy(): Promise<string[]> {
    try {
        const rows = await prisma.childCareFacility.findMany({
            select: { managedBy: true },
        });
        const values = rows
            .map((r) => r.managedBy.trim())
            .filter((m) => m !== "");
        return [...new Set(values)].sort((a, b) => a.localeCompare(b));
    } catch (error) {
        if (error instanceof Error) {
            console.log("Error: ", error.stack);
        }
        return [];
    }
}

export async function fetchFacilityBySlug(slug: string) {
    let data = null;

    try {
        data = await prisma.childCareFacility.findUnique({
            where: { slug: slug },
        });
    } catch {}

    return data;
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
            data: data,
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
            data: data,
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
   limit. The token only allows the given path, content type and size. */
export async function createPhotoUploadToken(
    slug: string,
    fileName: string,
): Promise<{ token: string } | { error: string }> {
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

    try {
        const token = await generateClientTokenFromReadWriteToken({
            token: blobToken,
            pathname: `${slug}/${fileName}`,
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
            toDelete.map(
                (fileName) => `${vercelStorageUrl}/${slug}/${fileName}`,
            ),
            { token: blobToken },
        );
    } catch (error) {
        console.log("Couldn't delete photos", error);
        return { error: "Couldn't delete the photos" };
    }

    return { deleted: toDelete };
}
