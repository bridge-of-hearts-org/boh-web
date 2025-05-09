import Link from "next/link";
import Script from "next/script";
import { twMerge } from "tailwind-merge";
import { Link2, MapPin, PhoneCall, Users } from "lucide-react";

import Card from "@/components/Card";
import Button from "@/components/Button";
import ImageCarousel from "./ImageCarousel";
import NotFound from "@/app/not-found";
import PhoneNumberList from "@/components/PhoneNumberList";
import EmailList from "@/components/EmailList";
import Breadcrumbs from "@/components/Breadcrumbs";
import ImageComponent from "@/components/ImageComponent";
import { Gender } from "@prisma/client";
import { vercelStorageUrl } from "@/utils/defines";
import { Metadata } from "next";
import { fetchFacilityBySlug } from "@/app/actions/data";

import DefaultFacilityIconImage from "../../../../public/images/facility-directory-icon-default.png";

export async function generateMetadata({
    params,
}: FacilityPageProps): Promise<Metadata> {
    if (!params) {
        throw new Error("Missing params for FacilityProfilePage.");
    }

    const { slug } = await params;
    let facility = await fetchFacilityBySlug(slug);

    if (!facility) {
        return {
            title: "Facility Not Found | Bridge of Hearts",
            description: "This facility does not exist in our directory.",
        };
    }

    return {
        title: `${facility.name} | Bridge of Hearts`,
        description: `Get details about ${facility.name}, a Child Development Center (Children's Home) in ${facility.location.city}, Sri Lanka. Visit Bridge of Hearts for a directory of facilities across the country.`,
        openGraph: {
            title: `${facility.name}`,
            description: `Get details about ${facility.name}, located in ${facility.location.city}, Sri Lanka.`,
            url: `https://bridgeofhearts.lk/facility/${facility.slug}`,
            images:
                facility.photos.length > 0
                    ? facility.photos.map((photo) => {
                          return {
                              url: `${vercelStorageUrl}/${facility.slug}/${photo.fileName}`,
                          };
                      })
                    : [],
        },
    };
}

type FacilityPageProps = { params: Promise<{ slug: string }> };

export default async function FacilityProfilePage({
    params,
}: FacilityPageProps) {
    if (!params) {
        throw new Error("Missing params for FacilityProfilePage.");
    }

    /* NextJS requirement: params should be awaited before accessing 
        https://nextjs.org/docs/messages/sync-dynamic-apis*/
    const { slug } = await params;
    const data = await fetchFacilityBySlug(slug);

    if (!data) {
        return NotFound();
    }

    // Construct JSON-LD structured data
    const jsonLdData = {
        "@context": "https://schema.org",
        "@type": ["Organization", "ResidentialFacility"],
        parentOrganization: data.managedBy
            ? {
                  "@type": "Organization",
                  name: data.managedBy,
              }
            : undefined,
        name: data.name,
        description: `A Child Development Center (Children's Home) located in ${data.location.city}, ${data.location.district}, Sri Lanka.`,
        address: {
            "@type": "PostalAddress",
            streetAddress: data.location.address || "",
            addressLocality: data.location.city,
            addressRegion: data.location.district,
            addressCountry: "Sri Lanka",
        },
        url: `https://bridgeofhearts.lk/facility/${data.slug}`,
        telephone: data.contact.phone || undefined,
        email: data.contact.email || undefined,
        sameAs: [
            data.contact.facebook,
            data.contact.instagram,
            data.contact.website,
        ].filter(Boolean),
        image:
            data.photos.length > 0
                ? data.photos.map(
                      (photo) =>
                          `${vercelStorageUrl}/${data.slug}/${photo.fileName}`,
                  )
                : ["public/images/facility-directory-icon-default.png"],
        knowsAbout: [
            "Child Care",
            "Child Welfare",
            "Residential Care",
            "Child Development",
        ],
        keywords: [
            "children's home",
            "orphanage",
            "child development center",
            "correction home",
            data.type,
        ].join(","),
    };

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
            <div className="flex w-full flex-col gap-5 lg:w-3/4">
                <Breadcrumbs
                    hierarchy={[
                        {
                            text: "Home",
                            link: "/",
                        },
                        {
                            text: "Directory",
                            link: "/directory",
                        },
                        {
                            text: `${data.name}`,
                            link: `/facility/${data.slug}`,
                        },
                    ]}
                />
                <Card className="w-full">
                    <div className="flex flex-col items-center justify-start gap-10 p-1 md:p-5">
                        {/* Photo section */}
                        {data.photos.length == 0 && (
                            <div className="h-[200px] w-[200px] rounded-3xl bg-orange-50 p-10">
                                <ImageComponent
                                    src={DefaultFacilityIconImage}
                                    sizes="200px"
                                    placeholder="blur"
                                    width={200}
                                    alt="Illustration of a cozy house with a red roof, surrounded by trees and sunlight"
                                    className="rounded-none"
                                />
                            </div>
                        )}
                        {data.photos.length > 0 && (
                            <ImageCarousel
                                slug={data.slug}
                                photos={data.photos}
                            />
                        )}

                        {/* Info sections */}
                        <div className="flex w-full flex-col items-center gap-14">
                            {/* Title */}
                            <div className="flex flex-col items-center">
                                <h1 className="text-center text-2xl font-bold">
                                    {data.name}
                                </h1>
                                <div className="text-center">{data.type}</div>
                            </div>

                            {/* Location */}
                            <div className={infoSectionStyles}>
                                {/* Header */}
                                <div className={infoTableHeaderStyles}>
                                    <MapPin />
                                    <h2 className="font-semibold">Location</h2>
                                </div>

                                {/* Table */}
                                <div className={infoTableStyles}>
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
                                            City
                                        </div>
                                        <div className="">
                                            {data.location.city}
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
                                                    className="boh-link"
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
                                    <h2 className="font-semibold">Contact</h2>
                                </div>

                                {/* Table */}
                                <div className={infoTableStyles}>
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
                                                    className="boh-link"
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
                                                    className="boh-link"
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
                                                    href={
                                                        data.contact.instagram
                                                    }
                                                    className="boh-link"
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
                                    <h1 className="font-semibold">Residents</h1>
                                </div>

                                {/* Table */}
                                <div
                                    className={twMerge(
                                        infoTableStyles,
                                        "gap-6",
                                    )}
                                >
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            Genders
                                        </div>
                                        <div className="">
                                            {data.genders == Gender.male
                                                ? "Male"
                                                : data.genders == Gender.female
                                                  ? "Female"
                                                  : data.genders == Gender.both
                                                    ? "Male / Female"
                                                    : noInfoElement}
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
                                                            ? data.occupancy
                                                                  .male
                                                            : data.genders ==
                                                                "male"
                                                              ? data.occupancy
                                                                    .total
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
                                                            ? data.occupancy
                                                                  .female
                                                            : data.genders ==
                                                                "female"
                                                              ? data.occupancy
                                                                    .total
                                                              : noInfoElement}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="grid grid-cols-2 font-semibold">
                                                    <div>Total</div>
                                                    <div>
                                                        {data.occupancy.total
                                                            ? data.occupancy
                                                                  .total
                                                            : noInfoElement}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            Ages
                                        </div>
                                        <div className="">
                                            <div>
                                                <div className="grid grid-cols-2">
                                                    <div className="italic">
                                                        Male
                                                    </div>
                                                    <div>
                                                        {data.ageRanges.male
                                                            ? data.ageRanges
                                                                  .male
                                                            : data.genders ==
                                                                "male"
                                                              ? data.ageRanges
                                                                    .all
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
                                                            ? data.ageRanges
                                                                  .female
                                                            : data.genders ==
                                                                "female"
                                                              ? data.ageRanges
                                                                    .all
                                                                  ? data
                                                                        .ageRanges
                                                                        .all
                                                                  : noInfoElement
                                                              : noInfoElement}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="grid grid-cols-2 font-semibold">
                                                    <div>All</div>
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

                            {/* Sources */}
                            <div className={infoSectionStyles}>
                                {/* Header */}
                                <div className={infoTableHeaderStyles}>
                                    <Link2 />
                                    <h1 className="font-semibold">Sources</h1>
                                </div>

                                {/* Table */}
                                <div
                                    className={twMerge(
                                        infoTableStyles,
                                        "gap-1",
                                    )}
                                >
                                    {data.sources.map((source, idx) => {
                                        return (
                                            <ul className="flex list-disc gap-1">
                                                <li>
                                                    <a
                                                        key={idx}
                                                        href={source}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="boh-link"
                                                    >
                                                        {source}
                                                    </a>
                                                </li>
                                            </ul>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-xs italic">
                            Please contact us at{" "}
                            <a
                                href="mailto:bridgeofheartslk@gmail.com"
                                className="boh-link"
                            >
                                bridgeofheartslk@gmail.com
                            </a>{" "}
                            if there are any data discrepancies or if you have
                            more up-to-date information
                        </p>

                        {/* Buttons */}
                        <div className="flex w-full justify-end">
                            <Link href="/directory">
                                <Button name="Go Back" variant="secondary">
                                    Back
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>
            <Script
                type="application/ld+json"
                id="json-ld-facility"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
            />
        </div>
    );
}
