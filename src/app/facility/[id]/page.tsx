import { prisma } from "@/utils/db";
import NotFound from "./NotFound";
import Card from "@/components/Card";
import Image from "next/image";
import { MapPin, PhoneCall, Users } from "lucide-react";
import Link from "next/link";
import Button from "@/components/Button";
import ImageCarousel from "./ImageCarousel";

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

    const data = await prisma.childCareFacility.findUnique({
        where: { id: id },
    });

    if (data == null) {
        return NotFound();
    }

    /* Constants */
    const noInfoText = "No Information";

    /* Styles */
    const infoSectionStyles =
        "flex w-full xl:w-2/3 flex-col gap-2 divide-y divide";
    const infoTableStyles = "py-4";
    const infoTableHeaderStyles =
        "flex items-center justify-start gap-2 pl-5 text-xl";
    const infoTableRowStyles = "grid grid-cols-[3fr,4fr] items-center gap-4";

    return (
        <div className="m-5 flex justify-center">
            <Card className="w-3/4 min-w-[600px]">
                <div className="flex flex-col items-center justify-start gap-10 p-5">
                    {/* Photo section */}
                    {data.photos.length == 0 && (
                        <div className="relative block h-[180px] w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-orange-50">
                            <Image
                                src="/images/facility-directory-icon-default.png"
                                alt="facility-icon"
                                fill
                                className="p-8"
                            />
                        </div>
                    )}
                    {data.photos.length > 0 && (
                        <ImageCarousel urls={data.photos} />
                    )}

                    {/* Info sections */}
                    <div className="flex w-full flex-col items-center gap-14">
                        {/* Title */}
                        <div className="flex flex-col items-center">
                            <div className="text-2xl font-bold">
                                {data.name}
                            </div>
                            <div className="">{data.type}</div>
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
                                <div className="flex flex-col gap-4 pl-10">
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            Address
                                        </div>
                                        <div className="">
                                            {data.location.address}
                                        </div>
                                    </div>
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            Divisional Secretariat
                                        </div>
                                        <div className="">
                                            {
                                                data.location
                                                    .divisionalSecretariat
                                            }
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
                                <div className="flex flex-col gap-4 pl-10">
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            Phone
                                        </div>
                                        <div className="">
                                            {data.contact.phone.length > 0
                                                ? data.contact.phone.join(", ")
                                                : noInfoText}
                                        </div>
                                    </div>
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            Email
                                        </div>
                                        <div className="">
                                            {data.contact.email.length > 0
                                                ? data.contact.email
                                                : noInfoText}
                                        </div>
                                    </div>
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            District
                                        </div>
                                        <div className="">
                                            {data.contact.website
                                                ? data.contact.website
                                                : noInfoText}
                                        </div>
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
                            <div className={infoTableStyles}>
                                <div className="flex flex-col gap-4 pl-10">
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            Total
                                        </div>
                                        <div className="">
                                            {data.residents.total > 0
                                                ? data.residents.total
                                                : noInfoText}
                                        </div>
                                    </div>
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            Male
                                        </div>
                                        <div className="">
                                            {data.residents.male
                                                ? data.residents.male
                                                : noInfoText}
                                        </div>
                                    </div>
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            Female
                                        </div>
                                        <div className="">
                                            {data.residents.female
                                                ? data.residents.female
                                                : noInfoText}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

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
