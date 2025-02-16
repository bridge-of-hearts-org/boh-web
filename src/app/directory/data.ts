import { DirectoryFilterType } from "@/utils/defines";
import { ChildCareFacility, Prisma } from "@prisma/client";

import { prisma } from "@/utils/db";

type FilteredFacilityResponse = Promise<
    [data: ChildCareFacility[], totalCount: number]
>;

export async function fetchAllFacilities(
    filterValues: DirectoryFilterType,
    sortBy: string,
    page: number,
    itemsPerPage: number,
): FilteredFacilityResponse {
    const getFilter = (): Prisma.ChildCareFacilityWhereInput[] => {
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
    };

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
                    AND: getFilter(),
                },
                take: itemsPerPage,
                skip: (page - 1) * itemsPerPage,
                orderBy: getOrderBy(),
            }),
            prisma.childCareFacility.count({
                where: {
                    AND: getFilter(),
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

export async function fetchFacilityBySlug(slug: string) {
    let data = null;

    try {
        data = await prisma.childCareFacility.findUnique({
            where: { slug: slug },
        });
    } catch {}

    return data;
}
