import Card from "@/components/Card";
import { MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { ChildCareFacility, Prisma } from "@prisma/client";

import { prisma } from "@/utils/db";
import FilterCard from "./FilterCard";
import { DirectoryFilterType, District, Province } from "@/utils/types";
import ImageComponent from "@/components/ImageComponent";

function createPrismaFilter(
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

async function fetchData(
    filterValues: DirectoryFilterType,
): Promise<ChildCareFacility[]> {
    try {
        const prismaFilters = [];

        const facilities = await prisma.childCareFacility.findMany({
            where: {
                AND: createPrismaFilter(filterValues),
            },
        });
        return facilities;
    } catch (error) {
        if (error instanceof Error) {
            console.log("Error: ", error.stack);
        }
        return [];
    }
}

export default async function DirectoryPage(props: {
    searchParams: Promise<{
        name?: string;
        district?: District | "";
        province?: Province | "";
    }>;
}) {
    const searchParams = await props.searchParams;

    const activeFilters: DirectoryFilterType = {
        name: searchParams.name || "",
        district: (searchParams.district as District) || "",
        province: (searchParams.province as Province) || "",
    };

    const facilities = await fetchData(activeFilters);

    return (
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[400px,1fr] lg:items-start">
            {/* Filter Card */}
            <FilterCard />

            <div className="flex flex-col gap-5 rounded-2xl">
                {facilities.map((facility) => {
                    return (
                        <Link
                            key={facility.id}
                            href={`/facility/${facility.id}`}
                        >
                            <Card>
                                <div className="flex flex-col items-center gap-4 sm:flex-row">
                                    {facility.photos.length > 0 && (
                                        <ImageComponent
                                            imageSrc={facility.photos[0]}
                                            containerClasses="w-[180px] h-[180px]"
                                            imageClasses="object-cover"
                                            imageSizes="180px"
                                        />
                                    )}
                                    {facility.photos.length == 0 && (
                                        <ImageComponent
                                            imageSrc="/images/facility-directory-icon-default.png"
                                            containerClasses="w-[180px] h-[180px] bg-orange-50"
                                            imageClasses="object-contain p-8"
                                            imageSizes="180px"
                                        />
                                    )}
                                    <div className="flex w-full flex-col items-center gap-5 sm:items-start">
                                        {/* Title section */}
                                        <div>
                                            <div className="text-lg font-semibold">
                                                {facility.name}
                                            </div>
                                            <div className="text-sm">
                                                {facility.type}
                                            </div>
                                        </div>

                                        {/* Address and contact section */}
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <div>
                                                    <MapPin size={"1rem"} />
                                                </div>
                                                <div>
                                                    {facility.location.address}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <div>
                                                    <Phone size={"1rem"} />
                                                </div>
                                                <div>
                                                    {facility.contact.phone.join(
                                                        ", ",
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Region section */}
                                        <div className="flex flex-col items-end self-end">
                                            <div className="flex items-center gap-2 text-sm">
                                                {facility.location.district}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm font-semibold">
                                                {facility.location.province}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
