import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { MapPin, PhoneCall, Users } from "lucide-react";

import { prisma } from "@/utils/db";
import Card from "@/components/Card";
import Button from "@/components/Button";
import ImageCarousel from "./ImageCarousel";
import NotFound from "@/app/not-found";
import ImageComponent from "@/components/ImageComponent";
import PhoneNumberList from "@/components/PhoneNumberList";
import EmailList from "@/components/EmailList";
import { Gender } from "@prisma/client";

type FacilityPageProps = { params: Promise<{ id: string }> };

export default async function FacilityProfilePage({
    params,
}: FacilityPageProps) {
    if (!params) {
        throw new Error("Missing params for FacilityProfilePage.");
    }

    /* NextJS requirement: params should be awaited before accessing 
        https://nextjs.org/docs/messages/sync-dynamic-apis*/
    const { id } = await params;
    let data = null;

    try {
        data = await prisma.childCareFacility.findUnique({
            where: { id: id },
        });

        if (data == null) {
            throw new Error("Data not found");
        }
    } catch {
        return NotFound();
    }

    /* Constants */
    const noInfoElement = <span>-</span>;

    /* Styles */
    const infoSectionStyles =
        "flex w-full xl:w-2/3 flex-col gap-2 divide-y divide";
    const infoTableStyles = "py-4 flex flex-col gap-3 pl-10";
    const infoTableHeaderStyles =
        "flex items-center justify-start gap-2 pl-5 md:text-xl text-lg";
    const infoTableRowStyles =
        "grid grid-cols-[3fr,4fr] items-center gap-4 flex-wrap break-words md:text-base text-sm break-words";

    return (
        <div className="m-1 flex justify-center md:m-5">
            <Card className="w-full lg:w-3/4">
                <div className="flex flex-col items-center justify-start gap-10 p-1 md:p-5">
                    {/* Photo section */}
                    {data.photos.length == 0 && (
                        <ImageComponent
                            imageSrc="/images/facility-directory-icon-default.png"
                            containerClasses="w-[180px] h-[180px] bg-orange-50"
                            imageClasses="object-contain p-8"
                            imageSizes="180px"
                        />
                    )}
                    {data.photos.length > 0 && (
                        <ImageCarousel urls={data.photos} />
                    )}

                    {/* Info sections */}
                    <div className="flex w-full flex-col items-center gap-14">
                        {/* Title */}
                        <div className="flex flex-col items-center">
                            <div className="text-center text-2xl font-bold">
                                {data.name}
                            </div>
                            <div className="text-center">{data.type}</div>
                        </div>

                        {/* Location */}
                        <div className={infoSectionStyles}>
                            {/* Header */}
                            <div className={infoTableHeaderStyles}>
                                <MapPin />
                                <div className="font-semibold">Location</div>
                            </div>

                            {/* Table */}
                            <div className={infoTableStyles}>
                                <div className={infoTableRowStyles}>
                                    <div className="font-semibold">Address</div>
                                    <div className="">
                                        {data.location.address}
                                    </div>
                                </div>
                                <div className={infoTableRowStyles}>
                                    <div className="font-semibold">
                                        Divisional Secretariat
                                    </div>
                                    <div className="">
                                        {data.location.divisionalSecretariat}
                                    </div>
                                </div>
                                <div className={infoTableRowStyles}>
                                    <div className="font-semibold">
                                        District
                                    </div>
                                    <div className="">
                                        {data.location.district}
                                    </div>
                                </div>
                                <div className={infoTableRowStyles}>
                                    <div className="font-semibold">
                                        Province
                                    </div>
                                    <div className="">
                                        {data.location.province}
                                    </div>
                                </div>
                                <div className={infoTableRowStyles}>
                                    <div className="font-semibold">
                                        Google Maps
                                    </div>
                                    <div className="">
                                        {data.location.google ? (
                                            <a
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                href={data.location.google}
                                                className="break-all hover:underline"
                                            >
                                                {data.location.google}
                                            </a>
                                        ) : (
                                            noInfoElement
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className={infoSectionStyles}>
                            {/* Header */}
                            <div className={infoTableHeaderStyles}>
                                <PhoneCall />
                                <div className="font-semibold">Contact</div>
                            </div>

                            {/* Table */}
                            <div className={infoTableStyles}>
                                <div className={infoTableRowStyles}>
                                    <div className="font-semibold">Phone</div>
                                    <div className="">
                                        <PhoneNumberList
                                            numbers={data.contact.phone}
                                            orientation="column"
                                        />
                                    </div>
                                </div>
                                <div className={infoTableRowStyles}>
                                    <div className="font-semibold">Email</div>
                                    <div className="break-all">
                                        <EmailList
                                            emails={data.contact.email}
                                        />
                                    </div>
                                </div>
                                <div className={infoTableRowStyles}>
                                    <div className="font-semibold">Website</div>
                                    <div className="">
                                        {data.contact.website ? (
                                            <a
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                href={data.contact.website}
                                                className="break-all hover:underline"
                                            >
                                                {data.contact.website}
                                            </a>
                                        ) : (
                                            noInfoElement
                                        )}
                                    </div>
                                </div>
                                <div className={infoTableRowStyles}>
                                    <div className="font-semibold">
                                        Facebook
                                    </div>
                                    <div className="">
                                        {data.contact.facebook ? (
                                            <a
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                href={data.contact.facebook}
                                                className="break-all hover:underline"
                                            >
                                                {data.contact.facebook}
                                            </a>
                                        ) : (
                                            noInfoElement
                                        )}
                                    </div>
                                </div>
                                <div className={infoTableRowStyles}>
                                    <div className="font-semibold">
                                        Instagram
                                    </div>
                                    <div className="">
                                        {data.contact.instagram ? (
                                            <a
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                href={data.contact.instagram}
                                                className="break-all hover:underline"
                                            >
                                                {data.contact.instagram}
                                            </a>
                                        ) : (
                                            noInfoElement
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Residents */}
                        <div className={infoSectionStyles}>
                            {/* Header */}
                            <div className={infoTableHeaderStyles}>
                                <Users />
                                <div className="font-semibold">Residents</div>
                            </div>

                            {/* Table */}
                            <div className={twMerge(infoTableStyles, "gap-6")}>
                                <div className={infoTableRowStyles}>
                                    <div className="font-semibold">Genders</div>
                                    <div className="">
                                        {data.genders == Gender.male
                                            ? "Male"
                                            : data.genders == Gender.female
                                              ? "Female"
                                              : "Male / Female"}
                                    </div>
                                </div>
                                <div className={infoTableRowStyles}>
                                    <div className="font-semibold">
                                        Occupancy
                                    </div>
                                    <div className="">
                                        <div>
                                            <div className="grid grid-cols-2">
                                                <div className="italic">
                                                    Male
                                                </div>
                                                <div>
                                                    {data.occupancy.male
                                                        ? data.occupancy.male
                                                        : data.genders == "male"
                                                          ? data.occupancy.total
                                                          : noInfoElement}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="grid grid-cols-2">
                                                <div className="italic">
                                                    Female
                                                </div>
                                                <div>
                                                    {data.occupancy.female
                                                        ? data.occupancy.female
                                                        : data.genders ==
                                                            "female"
                                                          ? data.occupancy.total
                                                          : noInfoElement}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="grid grid-cols-2 font-semibold">
                                                <div>Total</div>
                                                <div>
                                                    {data.occupancy.total
                                                        ? data.occupancy.total
                                                        : noInfoElement}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className={infoTableRowStyles}>
                                    <div className="font-semibold">Ages</div>
                                    <div className="">
                                        <div>
                                            <div className="grid grid-cols-2">
                                                <div className="italic">
                                                    Male
                                                </div>
                                                <div>
                                                    {data.ageRanges.male
                                                        ? data.ageRanges.male
                                                        : data.genders == "male"
                                                          ? data.ageRanges.all
                                                          : noInfoElement}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="grid grid-cols-2">
                                                <div className="italic">
                                                    Female
                                                </div>
                                                <div>
                                                    {data.ageRanges.female
                                                        ? data.ageRanges.female
                                                        : data.genders ==
                                                            "female"
                                                          ? data.ageRanges.all
                                                              ? data.ageRanges
                                                                    .all
                                                              : noInfoElement
                                                          : noInfoElement}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="grid grid-cols-2 font-semibold">
                                                <div>Total</div>
                                                <div>
                                                    {data.ageRanges.all
                                                        ? data.ageRanges.all
                                                        : noInfoElement}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-xs italic">
                        Please email us at{" "}
                        <a
                            href="mailto:bridgeofheartslk@gmail.com"
                            className="hover:underline"
                        >
                            bridgeofheartslk@gmail.com
                        </a>{" "}
                        if there are any data discrepancies or if you have more
                        up-to-date information
                    </p>

                    {/* Buttons */}
                    <div className="flex w-full justify-end">
                        <Link href="/directory">
                            <Button variant="secondary">Back</Button>
                        </Link>
                    </div>
                </div>
            </Card>
        </div>
    );
}
