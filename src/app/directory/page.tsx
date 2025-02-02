import Card from "@/components/Card";
import { MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { ChildCareFacility, Prisma } from "@prisma/client";

import { prisma } from "@/utils/db";
import FilterCard from "./FilterCard";
import { DirectoryFilterType, District, Province } from "@/utils/types";
import ImageComponent from "@/components/ImageComponent";
import Button from "@/components/Button";

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
        <div className="flex flex-col items-center gap-5 xl:grid xl:grid-cols-[400px,1fr] xl:items-start">
            {/* Filter Card */}
            <FilterCard />

            <div className="flex w-full flex-col gap-5 rounded-2xl">
                {facilities.map((facility) => {
                    return (
                        <Card key={facility.id}>
                            <div className="flex flex-col items-center gap-5 md:flex-row md:items-stretch">
                                <Link
                                    href={`/facility/${facility.id}`}
                                    className="self-center"
                                >
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
                                </Link>
                                <div className="flex grow flex-col justify-center gap-5">
                                    {/* Title section */}
                                    <div className="flex flex-col items-center gap-1 md:items-start">
                                        <div className="text-lg font-semibold">
                                            {facility.name}
                                        </div>
                                        <div className="text-sm">
                                            {facility.type}
                                        </div>
                                    </div>

                                    {/* Address and contact section */}
                                    <div className="flex flex-col items-center gap-2 md:items-start">
                                        <div className="flex items-center gap-2 text-sm">
                                            <div>
                                                <MapPin size={"1rem"} />
                                            </div>
                                            <div>
                                                {facility.location.address}
                                            </div>
                                        </div>
                                        {facility.contact.phone.length > 0 && (
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
                                        )}
                                    </div>
                                </div>
                                <div className="flex w-full flex-col items-center justify-between gap-5 pt-0 md:w-1/4 md:items-end">
                                    <div className="flex flex-col items-center md:items-end">
                                        <div className="flex items-center gap-2 text-sm">
                                            {facility.location.district}{" "}
                                            District
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            {facility.location.province}{" "}
                                            Province
                                        </div>
                                    </div>
                                    <Link href={`/facility/${facility.id}`}>
                                        <Button
                                            variant="secondary"
                                            color="black"
                                        >
                                            More Info
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
