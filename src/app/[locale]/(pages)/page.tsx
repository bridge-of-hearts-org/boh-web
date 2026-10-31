import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import React from "react";
import Button from "@/components/Button";
import { Link } from "@/i18n/navigation";
import ImageComponent from "@/components/ImageComponent";

import HeroSectionImage from "../../../../public/images/hero-section-photo.jpg";
import StatFacilityDroneImage from "../../../../public/images/facility-drone-image.jpg";
import StatDonationBoxesImage from "../../../../public/images/donation-boxes.jpg";
import StatSmilingChildrenImage from "../../../../public/images/smiling-children-2.jpg";
import Card from "@/components/Card";

type HomePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
    params,
}: HomePageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Home" });

    return {
        title: t("metaTitle"),
        description: t("metaDescription"),
    };
}

const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

export default async function HomePage({ params }: HomePageProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Home" });

    /* Sinhala has no separate "welcome" line; its subheading says it */
    const headingSmall = t("headingSmall");

    /* A language may leave out a paragraph that doesn't translate well */
    const paragraphs = (["p1", "p2", "p3", "p4"] as const).filter(
        (key) => t(key) !== "",
    );

    return (
        <div className="">
            {/* Hero Section */}
            <div className="m-10 flex flex-col items-center justify-center gap-10 xl:flex-row">
                <ImageComponent
                    src={HeroSectionImage}
                    loading="eager"
                    priority={true}
                    placeholder="blur"
                    width={700}
                    sizes="(max-width: 1280px) 80vw, 40vw"
                    alt={t("heroAlt")}
                    className=""
                />
                <div className="flex flex-col justify-center gap-5">
                    <div className="flex flex-col items-center gap-5 text-center text-lg">
                        <div>
                            {headingSmall !== "" && (
                                <h1 className="text-center font-encode-sans-sc text-xl font-semibold">
                                    {headingSmall}
                                </h1>
                            )}
                            <h1 className="mb-4 text-center font-encode-sans-sc text-3xl font-semibold">
                                {t("headingLarge")}
                            </h1>
                            <h2 className="mb-2 text-center text-xl font-semibold">
                                {t("subheading")}
                            </h2>
                        </div>

                        <div className="flex max-w-[600px] flex-col gap-5">
                            {paragraphs.map((key) => (
                                <p key={key}>{t.rich(key, { b: bold })}</p>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <Link href="/directory">
                            <Button
                                name="View Directory"
                                variant="secondary"
                                color="green"
                            >
                                View Directory
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stat section */}
            <div className="mb-10 w-[100%] rounded-3xl bg-[#f0e7df] p-10">
                <div className="flex flex-wrap justify-center gap-4 xl:gap-8">
                    <Card className="p-8">
                        <div className="flex w-[280px] flex-col items-center gap-4">
                            <ImageComponent
                                src={StatFacilityDroneImage}
                                sizes="280px"
                                height={230}
                                alt={t("aerialAlt")}
                            />
                            <p className="text-center">
                                {t.rich("stat1", { b: bold })}
                            </p>
                        </div>
                    </Card>
                    <Card className="p-8">
                        <div className="flex w-[280px] flex-col items-center gap-4">
                            <ImageComponent
                                src={StatDonationBoxesImage}
                                sizes="280px"
                                height={230}
                                alt={t("donationsAlt")}
                            />
                            <p className="text-center">
                                {t.rich("stat2", { b: bold })}
                            </p>
                        </div>
                    </Card>
                    <Card className="p-8">
                        <div className="flex w-[280px] flex-col items-center gap-4">
                            <ImageComponent
                                src={StatSmilingChildrenImage}
                                sizes="280px"
                                height={230}
                                alt={t("uniformsAlt")}
                            />
                            <p className="text-center">
                                {t.rich("stat3", { b: bold })}
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
