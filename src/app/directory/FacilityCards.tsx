import Link from "next/link";
import { MapPin, Phone } from "lucide-react";

import Card from "@/components/Card";
import ImageComponent from "@/components/ImageComponent";
import PhoneNumberList from "@/components/PhoneNumberList";
import Button from "@/components/Button";
import NavigationBar from "./NavigationBar";
import SortingBar from "./SortingBar";
import { fetchAllFacilities } from "./data";
import {
    DirectoryFilterType,
    District,
    Province,
    vercelStorageUrl,
} from "@/utils/defines";

import DefaultFacilityIconImage from "../../../public/images/facility-directory-icon-default.png";

const itemsPerPage = 10;

type FacilityCardProps = {
    name: string;
    city: string;
    district: District;
    province: Province;
    page: number;
    sortBy: string;
};

export async function FacilityCards(props: FacilityCardProps) {
    const activeFilters: DirectoryFilterType = {
        name: props.name,
        city: props.city,
        district: props.district,
        province: props.province,
    };

    const [facilities, totalCount] = await fetchAllFacilities(
        activeFilters,
        props.sortBy,
        props.page,
        itemsPerPage,
    );

    return (
        <>
            <div className="flex w-full flex-col gap-5">
                <SortingBar
                    page={props.page}
                    itemsPerPage={itemsPerPage}
                    totalCount={totalCount}
                />

                {facilities.map((facility, idx) => {
                    return (
                        <Card key={facility.id}>
                            <div className="flex flex-col items-center gap-5 md:flex-row md:items-stretch">
                                <Link
                                    href={`/facility/${facility.id}`}
                                    className="self-center"
                                >
                                    {facility.photos.length > 0 && (
                                        <ImageComponent
                                            src={`${vercelStorageUrl}/${facility.id}/${facility.photos[0].fileName}`}
                                            sizes="180px"
                                            width={180}
                                            height={180}
                                            alt="A picture taken at the children's home facility"
                                            className="h-[180px] w-[180px] object-cover"
                                        />
                                    )}
                                    {facility.photos.length == 0 && (
                                        <div className="h-[180px] w-[180px] rounded-3xl bg-orange-50 p-10">
                                            <ImageComponent
                                                src={DefaultFacilityIconImage}
                                                sizes="180px"
                                                placeholder="blur"
                                                width={180}
                                                alt="Illustration of a cozy house with a red roof, surrounded by trees and sunlight"
                                                className="rounded-none"
                                                loading={
                                                    idx < 3 ? "eager" : "lazy"
                                                }
                                            />
                                        </div>
                                    )}
                                </Link>
                                <div className="flex grow flex-col justify-center gap-5">
                                    {/* Title section */}
                                    <div className="flex flex-col items-center gap-1 md:items-start">
                                        <h2 className="text-center text-lg font-semibold md:text-left">
                                            {facility.name}
                                        </h2>
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
                                            <p className="text-left">
                                                {facility.location.address}
                                            </p>
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
                                        <h3 className="flex gap-2 text-right text-sm font-semibold">
                                            {facility.location.city}
                                        </h3>
                                        <p className="flex gap-2 text-right text-sm">
                                            {facility.location.district}{" "}
                                            District
                                        </p>
                                        <p className="flex gap-2 text-right text-sm">
                                            {facility.location.province}{" "}
                                            Province
                                        </p>
                                    </div>
                                    <Link href={`/facility/${facility.id}`}>
                                        <Button
                                            name="More Informmation"
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
        </>
    );
}

export function FacilityCardsSkeleton() {
    return (
        <div className="flex w-full flex-col gap-5">
            <div className="h-[77px] w-full animate-pulse rounded-2xl bg-gray-200"></div>
            {Array.from({ length: 10 }).map((_, idx) => (
                <div
                    key={idx}
                    className="h-[222px] w-full animate-pulse rounded-2xl bg-gray-200"
                ></div>
            ))}
        </div>
    );
}
