import NextLink from "next/link";
import { Link } from "@/i18n/navigation";
import Script from "next/script";
import { twMerge } from "tailwind-merge";
import {
    ExternalLink,
    Link2,
    MapPin,
    Pencil,
    PhoneCall,
    Users,
} from "lucide-react";

import Card from "@/components/Card";
import Button from "@/components/Button";
import ImageCarousel from "./ImageCarousel";
import LocationMap from "./LocationMap";
import NotFound from "@/app/[locale]/not-found";
import PhoneNumberList from "@/components/PhoneNumberList";
import EmailList from "@/components/EmailList";
import VerifiedBadge from "@/components/VerifiedBadge";
import {
    findAgeRangesVerifiedDate,
    findOccupancyVerifiedDate,
} from "@/utils/verification";
import Breadcrumbs from "@/components/Breadcrumbs";
import ImageComponent from "@/components/ImageComponent";
import { Gender } from "@prisma/client";
import { photoUrl } from "@/utils/photos";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { fetchFacilityBySlug } from "@/app/actions/data";
import {
    buildMapEmbedSrc,
    buildOpenInMapsUrl,
    hasCoordinates,
} from "@/utils/maps";
import { facilityEditPath } from "@/utils/navigation";
import { getServerAuth } from "@/lib/auth";
import { translatedValue } from "@/utils/i18n";

import DefaultFacilityIconImage from "../../../../../../public/images/facility-directory-icon-default.png";

export async function generateMetadata({
    params,
}: FacilityPageProps): Promise<Metadata> {
    if (!params) {
        throw new Error("Missing params for FacilityProfilePage.");
    }

    const { slug, locale } = await params;
    const t = await getTranslations({ locale, namespace: "Facility" });
    let facility = await fetchFacilityBySlug(slug);

    if (!facility) {
        return {
            title: t("notFoundTitle"),
            description: t("notFoundDescription"),
        };
    }

    const placeholders = {
        name: facility.name,
        city: facility.location.city,
    };

    return {
        title: `${facility.name} | Bridge of Hearts`,
        description: t("metaDescription", placeholders),
        openGraph: {
            title: `${facility.name}`,
            description: t("ogDescription", placeholders),
            url: `https://bridgeofhearts.lk/facility/${facility.slug}`,
            images:
                facility.photos.length > 0
                    ? facility.photos.map((photo) => {
                          return {
                              url: photoUrl(facility.slug, photo.fileName),
                          };
                      })
                    : [],
        },
    };
}

type FacilityPageProps = {
    params: Promise<{ slug: string; locale: string }>;
};

export default async function FacilityProfilePage({
    params,
}: FacilityPageProps) {
    if (!params) {
        throw new Error("Missing params for FacilityProfilePage.");
    }

    /* NextJS requirement: params should be awaited before accessing 
        https://nextjs.org/docs/messages/sync-dynamic-apis*/
    const { slug, locale } = await params;
    const data = await fetchFacilityBySlug(slug);

    if (!data) {
        return <NotFound />;
    }

    const t = await getTranslations({ locale, namespace: "Facility" });
    const tNav = await getTranslations({ locale, namespace: "Nav" });
    const tCard = await getTranslations({ locale, namespace: "FacilityCard" });
    const tMap = await getTranslations({ locale, namespace: "Map" });
    const tVerified = await getTranslations({ locale, namespace: "Verified" });
    const tProvinces = await getTranslations({
        locale,
        namespace: "Provinces",
    });
    const tDistricts = await getTranslations({
        locale,
        namespace: "Districts",
    });

    const session = await getServerAuth();
    const inAdminSession = session ? true : false;

    const occupancyVerifiedAt = findOccupancyVerifiedDate(
        data.occupancy,
        data.verification,
    );
    const ageRangesVerifiedAt = findAgeRangesVerifiedDate(
        data.ageRanges,
        data.verification,
    );

    const mapEmbedSrc = buildMapEmbedSrc(data.location);
    const openInMapsUrl = buildOpenInMapsUrl(data.location);

    /* Our own map, whose pin popup can link to the named place. Without
        coordinates or its key, fall back to the embed. */
    const interactiveMapLocation =
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY &&
        hasCoordinates(data.location) &&
        openInMapsUrl
            ? {
                  latitude: data.location.latitude,
                  longitude: data.location.longitude,
                  mapsUrl: openInMapsUrl,
              }
            : null;

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
                ? data.photos.map((photo) =>
                      photoUrl(data.slug, photo.fileName),
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

    /* Only shown when there's no map; with a map, its pin links to the place */
    const openInMapsLink = openInMapsUrl ? (
        <a
            href={openInMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-secondary-green px-4 py-2 font-encode-sans-sc font-semibold text-green-950 transition-all duration-100 hover:bg-secondary-green-hover"
        >
            <ExternalLink className="h-4 w-4" />
            Open in Google Maps
        </a>
    ) : null;

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
                            text: tNav("home"),
                            link: "/",
                        },
                        {
                            text: tNav("directory"),
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
                                    alt={tCard("placeholderAlt")}
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
                                {/* Admin pages are English-only, so this link
                                    has no locale prefix */}
                                {inAdminSession && (
                                    <NextLink
                                        href={facilityEditPath(data.slug)}
                                        className="mt-4 w-full sm:w-auto"
                                    >
                                        <Button
                                            name="Edit"
                                            variant="secondary"
                                            color="black"
                                            className="flex w-full items-center justify-center gap-2 sm:w-auto"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit
                                        </Button>
                                    </NextLink>
                                )}
                            </div>

                            {/* Location */}
                            <div className={infoSectionStyles}>
                                {/* Header */}
                                <div className={infoTableHeaderStyles}>
                                    <MapPin />
                                    <h2 className="font-semibold">
                                        {t("location")}
                                    </h2>
                                </div>

                                {/* Table */}
                                <div className={infoTableStyles}>
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            {t("address")}
                                        </div>
                                        <div className="">
                                            {data.location.address}
                                        </div>
                                    </div>
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            {t("city")}
                                        </div>
                                        <div className="">
                                            {data.location.city}
                                        </div>
                                    </div>
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            {t("divisionalSecretariat")}
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
                                            {t("district")}
                                        </div>
                                        <div className="">
                                            {translatedValue(
                                                tDistricts,
                                                data.location.district,
                                            )}
                                        </div>
                                    </div>
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            {t("province")}
                                        </div>
                                        <div className="">
                                            {translatedValue(
                                                tProvinces,
                                                data.location.province,
                                            )}
                                        </div>
                                    </div>
                                    {/* Map */}
                                    {interactiveMapLocation || mapEmbedSrc ? (
                                        <div className="overflow-hidden pt-4">
                                            {interactiveMapLocation ? (
                                                <LocationMap
                                                    name={data.name}
                                                    latitude={
                                                        interactiveMapLocation.latitude
                                                    }
                                                    longitude={
                                                        interactiveMapLocation.longitude
                                                    }
                                                    mapsUrl={
                                                        interactiveMapLocation.mapsUrl
                                                    }
                                                    fallbackEmbedSrc={
                                                        mapEmbedSrc
                                                    }
                                                />
                                            ) : (
                                                <iframe
                                                    title={tMap("iframeTitle")}
                                                    width="100%"
                                                    height="300"
                                                    className="rounded-3xl border-0"
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer-when-downgrade"
                                                    src={
                                                        mapEmbedSrc ?? undefined
                                                    }
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <div className={infoTableRowStyles}>
                                            <div className="font-semibold">
                                                {t("googleMaps")}
                                            </div>
                                            <div className="">
                                                {openInMapsLink ??
                                                    noInfoElement}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Contact */}
                            <div className={infoSectionStyles}>
                                {/* Header */}
                                <div className={infoTableHeaderStyles}>
                                    <PhoneCall />
                                    <h2 className="font-semibold">
                                        {t("contact")}
                                    </h2>
                                </div>

                                {/* Table */}
                                <div className={infoTableStyles}>
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            {t("phone")}
                                        </div>
                                        <div className="">
                                            <PhoneNumberList
                                                numbers={data.contact.phone}
                                                orientation="column"
                                                verified={
                                                    data.verification?.phones
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            {t("email")}
                                        </div>
                                        <div className="break-all">
                                            <EmailList
                                                emails={data.contact.email}
                                                verified={
                                                    data.verification?.emails
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            {t("website")}
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
                                    <h1 className="font-semibold">
                                        {t("residents")}
                                    </h1>
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
                                            {t("genders")}
                                        </div>
                                        <div className="">
                                            {data.genders == Gender.male
                                                ? t("male")
                                                : data.genders == Gender.female
                                                  ? t("female")
                                                  : data.genders == Gender.both
                                                    ? t("both")
                                                    : noInfoElement}
                                        </div>
                                    </div>
                                    <div className={infoTableRowStyles}>
                                        <div className="font-semibold">
                                            {t("occupancy")}
                                            {occupancyVerifiedAt && (
                                                <VerifiedBadge
                                                    label={tVerified(
                                                        "occupancy",
                                                    )}
                                                    align="start"
                                                    verifiedAt={
                                                        occupancyVerifiedAt
                                                    }
                                                />
                                            )}
                                        </div>
                                        <div className="">
                                            <div>
                                                <div className="grid grid-cols-2">
                                                    <div className="italic">
                                                        {t("rowMale")}
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
                                                        {t("rowFemale")}
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
                                                    <div>{t("total")}</div>
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
                                            {t("ages")}
                                            {ageRangesVerifiedAt && (
                                                <VerifiedBadge
                                                    label={tVerified(
                                                        "ageRanges",
                                                    )}
                                                    align="start"
                                                    verifiedAt={
                                                        ageRangesVerifiedAt
                                                    }
                                                />
                                            )}
                                        </div>
                                        <div className="">
                                            <div>
                                                <div className="grid grid-cols-2">
                                                    <div className="italic">
                                                        {t("rowMale")}
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
                                                        {t("rowFemale")}
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
                                                    <div>{t("all")}</div>
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
                                    <h1 className="font-semibold">
                                        {t("sources")}
                                    </h1>
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
                            {t.rich("contactUs", {
                                email: () => (
                                    <a
                                        href="mailto:bridgeofheartslk@gmail.com"
                                        className="boh-link"
                                    >
                                        bridgeofheartslk@gmail.com
                                    </a>
                                ),
                            })}
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
