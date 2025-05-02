"use client";

import ImageComponent from "@/components/ImageComponent";
import emailIcon from "../../../public/images/email-icon.png";
import Link from "next/link";

export default function Contact() {
    return (
        <div>
            <div className="bg-gradient-to-r from-white/10 via-orange-100/50 to-white/10 py-10">
                <h1 className="text-center font-encode-sans-sc text-xl font-bold">
                    Contact Us
                </h1>
            </div>
            <div className="mt-12 flex flex-col items-center gap-10">
                <ImageComponent
                    src={emailIcon}
                    height={80}
                    sizes="80px"
                    alt="Envelope with a letter inside that has an @ symbol"
                    title="Email icons created by Freepik - Flaticon"
                />
                <div className="w-3/4 text-center lg:w-2/3">
                    <p>
                        We'd love to hear from you! If you have any questions or
                        feedback, feel free to reach out to us.
                    </p>
                    <div className="flex flex-col">
                        <div className="grid grid-cols-[1fr,2fr] gap-x-5 gap-y-1">
                            <span className="justify-self-end font-semibold">
                                Email:
                            </span>
                            <a
                                href="mailto:bridgeofheartslk@gmail.com"
                                className="boh-link justify-self-start"
                            >
                                bridgeofheartslk@gmail.com
                            </a>
                            <span className="justify-self-end font-semibold">
                                Facebook:{" "}
                            </span>
                            <a
                                href="https://www.facebook.com/people/The-Bridge-of-Hearts-Project/61573039696750/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="boh-link justify-self-start"
                            >
                                The Bridge of Hearts Project
                            </a>
                            <span className="justify-self-end font-semibold">
                                Instagram:{" "}
                            </span>
                            <a
                                href="https://www.instagram.com/bridgeofheartslk/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="boh-link justify-self-start"
                            >
                                bridgeofheartslk
                            </a>
                        </div>
                    </div>
                    <p className="mt-5">
                        If you have up-to-date information about any children's
                        home listed on our website or know of a facility that
                        should be included, please let us know. Your
                        contributions help us keep our directory accurate and
                        helps future donors find the information they need to
                        support the children.
                    </p>
                </div>
                <p className="text-center">
                    <Link href="/directory" className="boh-link">
                        Explore our directory of Child Development Centres
                        (Children's Homes) in Sri Lanka.
                    </Link>
                </p>
            </div>
        </div>
    );
}
