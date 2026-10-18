"use server";

import {
    ChildCareFacilityInput,
    DirectoryFilterType,
    FacilityPin,
} from "@/utils/defines";
import { ChildCareFacility, Prisma } from "@prisma/client";
import { config } from "dotenv";

import { prisma } from "@/utils/db";
import { getServerAuth } from "@/lib/auth";
import { extractLatLng, isGoogleMapsUrl, LatLng } from "@/utils/maps";

/* Server actions are public POST endpoints, so every write action must check
   for an admin session itself instead of relying on the page being gated */
const UNAUTHORIZED = "Unauthorized: admin login required";

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
                        contains: filterValues.province,
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
                    select: { city: true, latitude: true, longitude: true },
                },
            },
        });

        return facilities
            .filter((f) => f.location.latitude && f.location.longitude)
            .map((f) => ({
                name: f.name,
                slug: f.slug,
                city: f.location.city,
                lat: f.location.latitude!,
                lng: f.location.longitude!,
            }));
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

        if (error instanceof Error) {
            return error.message;
        } else {
            console.log(error);
            return `Unknown Error: ${error}`;
        }
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

        if (error instanceof Error) {
            return error.message;
        } else {
            console.log(error);
            return `Unknown Error: ${error}`;
        }
    }

    return "success";
}

export async function resolveLatLng(
    url: string,
): Promise<LatLng | { error: string }> {
    /* This fetches arbitrary URLs server-side, so restrict it to admins and Google Maps hosts */
    const session = await getServerAuth();
    if (!session) {
        return { error: "Not authorised" };
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

    return { latitude: coords.latitude, longitude: coords.longitude };
}
