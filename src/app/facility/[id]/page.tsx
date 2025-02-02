import { prisma } from "@/utils/db";
import Card from "@/components/Card";
import Image from "next/image";
import { MapPin, PhoneCall, Users } from "lucide-react";
import Link from "next/link";
import Button from "@/components/Button";
import ImageCarousel from "./ImageCarousel";
import NotFound from "@/app/not-found";
import ImageComponent from "@/components/ImageComponent";
import PhoneNumberList from "@/components/PhoneNumberList";
import EmailList from "@/components/EmailList";

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
    const infoTableStyles = "py-4";
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
                                            <PhoneNumberList
                                                numbers={data.contact.phone}
                                                orientation="column"
                                            />
                                        </div>
                                    </div>
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            Email
                                        </div>
                                        <div className="break-all">
                                            <EmailList
                                                emails={data.contact.email}
                                            />
                                        </div>
                                    </div>
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            Website
                                        </div>
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
                                            {data.residents.total
                                                ? data.residents.total
                                                : noInfoElement}
                                        </div>
                                    </div>
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            Male
                                        </div>
                                        <div className="">
                                            {data.residents.male
                                                ? data.residents.male
                                                : noInfoElement}
                                        </div>
                                    </div>
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            Female
                                        </div>
                                        <div className="">
                                            {data.residents.female
                                                ? data.residents.female
                                                : noInfoElement}
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
