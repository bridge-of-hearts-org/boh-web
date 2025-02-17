import { Metadata } from "next";

import React from "react";
import Button from "../components/Button";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import ImageComponent from "@/components/ImageComponent";

import HeroSectionImage from "../../public/images/hero-section-photo.jpg";
import StatFacilityDroneImage from "../../public/images/facility-drone-image.jpg";
import StatDonationBoxesImage from "../../public/images/donation-boxes.jpg";
import StatSmilingChildrenImage from "../../public/images/smiling-children-2.jpg";

export const metadata: Metadata = {
    title: "Home | Bridge of Hearts",
    description:
        "Welcome to Bridge of Hearts, an online directory for Child Development Centers (Children's Homes) in Sri Lanka.",
};

export default function HomePage() {
    return (
        <div className="">
            {/* Hero Section */}
            <div className="m-10 flex flex-col items-center justify-center gap-10 xl:flex-row">
                <ImageComponent
                    src={HeroSectionImage}
                    loading="eager"
                    priority={true}
                    placeholder="blur"
                    width={640}
                    sizes="(max-width: 1280px) 80vw, 40vw"
                    alt="Three children smiling happily at the camera"
                    className=""
                />
                <div className="flex flex-col justify-center gap-5">
                    <div className="flex flex-col items-center gap-5 text-center text-lg">
                        <div>
                            <h1 className="text-center font-encode-sans-sc text-xl font-semibold">
                                Welcome to the
                            </h1>
                            <h1 className="mb-4 text-center font-encode-sans-sc text-3xl font-semibold">
                                Bridge of Hearts Project
                            </h1>
                            <h2 className="mb-2 text-center text-xl font-semibold">
                                An online directory for Child Development
                                Centers in Sri Lanka.
                            </h2>
                        </div>
                        <div className="flex max-w-[600px] flex-col gap-5">
                            <p>
                                There are more than 300 Child Development
                                Centers, commonly known as Children's Homes in
                                Sri Lanka, with more than 10,000 children.
                            </p>
                            <p>
                                Our mission is to provide a reliable, regularly
                                updated resource with comprehensive information
                                about these facilities, so that donors can find
                                the places that are most in need.
                            </p>
                            <p>
                                Together, let's bridge hearts and connect
                                communities.
                            </p>
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
                    {/* Stat Card */}
                    <StatCard
                        imageSrc={StatFacilityDroneImage}
                        imageAlt="An aerial view of a children's home, with a playground in front of it, where children are playing"
                        statText="There are 4,000+ child care facilities in Sri Lanka"
                    />
                    <StatCard
                        imageSrc={StatDonationBoxesImage}
                        imageAlt="Three boxes of donations, with clothes, food and stationery supplies"
                        statText="60% of child care facilities run on external donations"
                    />
                    <StatCard
                        imageSrc={StatSmilingChildrenImage}
                        imageAlt="Children in school uniforms smiling at the camera"
                        statText="71% of the children are between ages 5-14"
                    />
                </div>
            </div>
        </div>
    );
}
