"use client";

import ImageComponent from "@/components/ImageComponent";
import emailIcon from "../../../public/images/email-icon.png";

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
                        feedback, feel free to reach out to us at
                    </p>
                    <a
                        href="mailto:bridgeofheartslk@gmail.com"
                        className="boh-link text-lg"
                    >
                        bridgeofheartslk@gmail.com
                    </a>
                    <p className="mt-5">
                        If you have up-to-date information about any children's
                        home listed on our website or know of a facility that
                        should be included, please let us know. Your
                        contributions help us keep our directory accurate and
                        helps future donors find the information they need to
                        support the children.
                    </p>
                </div>
            </div>
        </div>
    );
}
