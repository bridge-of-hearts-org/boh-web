import Card from "@/components/Card";
import { MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { ChildCareFacility, Prisma } from "@prisma/client";

import { prisma } from "@/utils/db";
import FilterCard from "./FilterCard";
import {
    DirectoryFilterType,
    District,
    Province,
    vercelStorageUrl,
} from "@/utils/defines";
import ImageComponent from "@/components/ImageComponent";
import Button from "@/components/Button";
import PhoneNumberList from "@/components/PhoneNumberList";
import NavigationBar from "./NavigationBar";
import SortingBar from "./SortingBar";

const itemsPerPage = 10;

type FilteredFacilityResponse = Promise<
    [data: ChildCareFacility[], totalCount: number]
>;

async function fetchData(
    filterValues: DirectoryFilterType,
    sortBy: string,
    page: number,
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

export default async function DirectoryPage(props: {
    searchParams: Promise<{
        name?: string;
        city?: string;
        district?: District | "";
        province?: Province | "";
        sortBy?: string;
        page: number;
    }>;
}) {
    const searchParams = await props.searchParams;
    const currentPage = searchParams.page || 1;

    const activeFilters: DirectoryFilterType = {
        name: searchParams.name || "",
        city: searchParams.city || "",
        district: (searchParams.district as District) || "",
        province: (searchParams.province as Province) || "",
    };

    const [facilities, totalCount] = await fetchData(
        activeFilters,
        searchParams.sortBy || "name",
        currentPage || 1, // Default to page 1
    );

    return (
        <div className="flex flex-col items-center gap-5 xl:grid xl:grid-cols-[400px,1fr] xl:items-start">
            {/* Filter Card */}
            <FilterCard />

            <div className="flex w-full flex-col gap-5 rounded-2xl">
                <SortingBar
                    page={currentPage}
                    itemsPerPage={itemsPerPage}
                    totalCount={totalCount}
                />

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
                                            imageSrc={`${vercelStorageUrl}/${facility.id}/${facility.photos[0]}`}
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
                                        <div className="text-center text-lg font-semibold md:text-left">
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
                                            <div className="text-left">
                                                {facility.location.address}
                                            </div>
                                        </div>
                                        {facility.contact.phone.length > 0 && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <div>
                                                    <Phone size={"1rem"} />
                                                </div>
                                                <div>
                                                    <PhoneNumberList
                                                        numbers={
                                                            facility.contact
                                                                .phone
                                                        }
                                                        orientation="row"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex w-full flex-col items-center justify-between gap-5 pt-0 md:w-1/4 md:items-end">
                                    <div className="flex flex-col items-center md:items-end">
                                        <div className="flex gap-2 text-right text-sm font-semibold">
                                            {facility.location.city}
                                        </div>
                                        <div className="flex gap-2 text-right text-sm">
                                            {facility.location.district}{" "}
                                            District
                                        </div>
                                        <div className="flex gap-2 text-right text-sm">
                                            {facility.location.province}{" "}
                                            Province
                                        </div>
                                    </div>
                                    <Link href={`/facility/${facility.id}`}>
                                        <Button
                                            variant="secondary"
                                            color="black"
                                            className="text-nowrap"
                                        >
                                            More Info
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    );
                })}
                <div className="mt-10 flex justify-center">
                    <NavigationBar
                        totalPages={Math.ceil(totalCount / itemsPerPage)}
                    />
                </div>
            </div>
        </div>
    );
}
