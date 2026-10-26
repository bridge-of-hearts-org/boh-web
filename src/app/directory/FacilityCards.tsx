import Link from "next/link";
import { MapPin, Phone } from "lucide-react";

import Card from "@/components/Card";
import ImageComponent from "@/components/ImageComponent";
import PhoneNumberList from "@/components/PhoneNumberList";
import Button from "@/components/Button";
import NavigationBar from "./NavigationBar";
import SortingBar from "./SortingBar";
import { fetchAllFacilities, fetchFacilityPins } from "../actions/data";
import { DirectoryFilterType, District, Province } from "@/utils/defines";
import { lastPage } from "@/utils/pagination";

import DefaultFacilityIconImage from "../../../public/images/facility-directory-icon-default.png";
import MapWidget from "./MapWidget";
import ListingPhotoCarousel from "./ListingPhotoCarousel";

type FacilityCardProps = {
    name: string;
    city: string;
    managedBy: string;
    district: District;
    province: Province;
    page: number;
    sortBy: string;
    itemsPerPage: number;
};

export async function FacilityCards(props: FacilityCardProps) {
    const activeFilters: DirectoryFilterType = {
        name: props.name,
        city: props.city,
        managedBy: props.managedBy,
        district: props.district,
        province: props.province,
    };

    const [[firstFacilities, firstTotalCount], pins] = await Promise.all([
        fetchAllFacilities(
            activeFilters,
            props.sortBy,
            props.page,
            props.itemsPerPage,
        ),
        fetchFacilityPins(activeFilters),
    ]);
    let page = props.page;
    let facilities = firstFacilities;
    let totalCount = firstTotalCount;

    /* A page past the end (e.g. a stale link after filtering) shows the last page instead */
    const totalPages = lastPage(totalCount, props.itemsPerPage);
    if (page > totalPages) {
        page = totalPages;
        [facilities, totalCount] = await fetchAllFacilities(
            activeFilters,
            props.sortBy,
            page,
            props.itemsPerPage,
        );
    }

    return (
        <>
            <div className="flex w-full flex-col gap-5">
                <SortingBar
                    page={page}
                    itemsPerPage={props.itemsPerPage}
                    totalCount={totalCount}
                />

                <MapWidget pins={pins} />

                {facilities.map((facility, idx) => {
                    return (
                        <Card key={facility.id}>
                            <div className="flex flex-col items-center gap-5 md:flex-row md:items-stretch">
                                {facility.photos.length > 0 && (
                                    <ListingPhotoCarousel
                                        slug={facility.slug}
                                        name={facility.name}
                                        photoFileNames={facility.photos.map(
                                            (photo) => photo.fileName,
                                        )}
                                    />
                                )}
                                {facility.photos.length == 0 && (
                                    <Link
                                        href={`/facility/${facility.slug}`}
                                        className="self-center"
                                    >
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
                                    </Link>
                                )}
                                <div className="flex grow flex-col justify-center gap-5">
                                    {/* Title section */}
                                    <div className="flex flex-col items-center gap-1 md:items-start">
                                        <Link
                                            href={`/facility/${facility.slug}`}
                                        >
                                            <h2 className="text-center text-lg font-semibold md:text-left">
                                                {facility.name}
                                            </h2>
                                        </Link>
                                        <div className="text-sm">
                                            {facility.type}
                                        </div>
                                        {facility.managedBy && (
                                            <div className="text-sm italic">
                                                {`${facility.managedBy}`}
                                            </div>
                                        )}
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
                                    <Link href={`/facility/${facility.slug}`}>
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
                        currentPage={page}
                        totalPages={lastPage(totalCount, props.itemsPerPage)}
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
