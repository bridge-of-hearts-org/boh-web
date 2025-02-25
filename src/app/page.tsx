import { Metadata } from "next";

import React from "react";
import Button from "../components/Button";
import Link from "next/link";
import ImageComponent from "@/components/ImageComponent";

import HeroSectionImage from "../../public/images/hero-section-photo.jpg";
import StatFacilityDroneImage from "../../public/images/facility-drone-image.jpg";
import StatDonationBoxesImage from "../../public/images/donation-boxes.jpg";
import StatSmilingChildrenImage from "../../public/images/smiling-children-2.jpg";
import Card from "@/components/Card";

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
                    width={700}
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
                                Every child deserves love, care, and a chance
                                for a brighter future. Yet, in Sri Lanka, more
                                than <strong>10,000 children</strong> live in
                                over{" "}
                                <strong>370 Child Development Centers</strong>{" "}
                                commonly known as children's homes seeking
                                stability and support.
                            </p>
                            <p>
                                At <strong>Bridge of Hearts</strong>, we believe
                                in the power of connection. Our mission is to
                                provide a trusted, up-to-date resource that
                                shines a light on these homes, making it easier
                                for donors to find and support the children who
                                need it most.
                            </p>
                            <p>
                                With most child care facilities relying on
                                external donations, your generosity can make a
                                life-changing impact. Whether you give,
                                volunteer, or spread the word you become part of
                                a movement that bridges hearts and strengthens
                                communities.
                            </p>
                            <p>
                                Together, let's bring hope, one child at a time.
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
                    <Card className="p-8">
                        <div className="flex w-[280px] flex-col items-center gap-4">
                            <ImageComponent
                                src={StatFacilityDroneImage}
                                sizes="280px"
                                height={230}
                                alt="An aerial view of a children's home, with a playground in front of it, where children are playing"
                            />
                            <p className="text-center">
                                There are more than <strong>370</strong> child
                                care facilities in Sri Lanka
                            </p>
                        </div>
                    </Card>
                    <Card className="p-8">
                        <div className="flex w-[280px] flex-col items-center gap-4">
                            <ImageComponent
                                src={StatDonationBoxesImage}
                                sizes="280px"
                                height={230}
                                alt="Three boxes of donations, with clothes, food and stationery supplies"
                            />
                            <p className="text-center">
                                <strong>60%</strong> of child care facilities
                                run on external donations
                            </p>
                        </div>
                    </Card>
                    <Card className="p-8">
                        <div className="flex w-[280px] flex-col items-center gap-4">
                            <ImageComponent
                                src={StatSmilingChildrenImage}
                                sizes="280px"
                                height={230}
                                alt="Children in school uniforms smiling at the camera"
                            />
                            <p className="text-center">
                                <strong>71%</strong> of the children are between
                                ages <strong>5-14</strong>
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
