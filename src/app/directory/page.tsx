import Card from "@/components/Card";
import { MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ChildCareFacility } from "@prisma/client";

import { prisma } from "@/utils/db";
import FilterCard from "./FilterCard";
import { DirectoryFilterType, District, Province } from "@/utils/types";

async function fetchData(filterValues: {
    name: string;
    district: string;
    province: string;
}): Promise<ChildCareFacility[]> {
    try {
        const prismaFilters = [];

        if (filterValues.name) {
            prismaFilters.push({
                name: {
                    contains: filterValues.name,
                    mode: "insensitive",
                },
            });
        }

        if (filterValues.district) {
            prismaFilters.push({
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
            prismaFilters.push({
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

        const facilities = await prisma.childCareFacility.findMany({
            where: {
                AND: prismaFilters,
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
        <div className="flex min-w-[400px] flex-col gap-5 lg:grid lg:grid-cols-[400px,1fr] lg:items-start">
            {/* Filter Card */}
            <FilterCard />

            <div className="flex min-w-[400px] flex-col gap-5 rounded-2xl">
                {facilities.map((facility) => {
                    return (
                        <Link
                            key={facility.id}
                            href={`/facility/${facility.id}`}
                        >
                            <Card>
                                <div className="flex gap-4">
                                    {facility.photos.length > 0 && (
                                        <div className="relative block h-[180px] w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-orange-50">
                                            <Image
                                                src={facility.photos[0]}
                                                alt="facility-icon"
                                                fill
                                            />
                                        </div>
                                    )}
                                    {facility.photos.length == 0 && (
                                        <div className="relative block h-[180px] w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-orange-50">
                                            <Image
                                                src="/images/facility-directory-icon-default.png"
                                                alt="facility-icon"
                                                fill
                                                className="p-8"
                                            />
                                        </div>
                                    )}
                                    <div className="flex w-full flex-col gap-5">
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
                                        <div className="flex flex-col items-end">
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
