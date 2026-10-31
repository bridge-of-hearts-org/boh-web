"use client";

import ImageComponent from "@/components/ImageComponent";
import emailIcon from "../../../../../public/images/email-icon.png";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function Contact() {
    const t = useTranslations("Contact");
    const tExplore = useTranslations("ExploreDirectory");

    return (
        <div>
            <div className="bg-gradient-to-r from-white/10 via-orange-100/50 to-white/10 py-10">
                <h1 className="text-center font-encode-sans-sc text-xl font-bold">
                    {t("heading")}
                </h1>
            </div>
            <div className="mt-12 flex flex-col items-center gap-10">
                <ImageComponent
                    src={emailIcon}
                    height={80}
                    sizes="80px"
                    alt={t("envelopeAlt")}
                    title="Email icons created by Freepik - Flaticon"
                />
                <div className="w-3/4 text-center lg:w-2/3">
                    <p>{t("intro")}</p>
                    <div className="flex flex-col">
                        <div className="grid grid-cols-[1fr,2fr] gap-x-5 gap-y-1">
                            <span className="justify-self-end font-semibold">
                                {t("email")}
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
                    <p className="mt-5">{t("help")}</p>
                </div>
                <p className="text-center">
                    <Link href="/directory" className="boh-link break-normal">
                        {tExplore("link")}
                    </Link>
                </p>
            </div>
        </div>
    );
}
