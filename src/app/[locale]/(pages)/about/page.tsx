import ImageComponent from "@/components/ImageComponent";
import VolunteerIcon from "@/../public/images/volunteer-hands-icon.png";
import ChildrenIcon from "@/../public/images/children-icon.png";
import DonationIcon from "@/../public/images/donation-icon.png";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

export default function About() {
    const t = useTranslations("About");
    const tExplore = useTranslations("ExploreDirectory");

    /* Paragraphs keep the translation's own line breaks */
    const paragraph = (key: "p1" | "p2" | "p3" | "p4") => (
        <p className="whitespace-pre-line">{t.rich(key, { b: bold })}</p>
    );

    return (
        <div className="flex flex-col items-center">
            <div className="mb-10 bg-gradient-to-r from-white/10 via-orange-100/50 to-white/10 py-10">
                <h1 className="text-center font-encode-sans-sc text-xl font-bold">
                    {t("heading")}
                </h1>
            </div>
            <div className="flex flex-col items-center gap-5 px-10 text-justify lg:w-2/3 lg:px-20">
                <div className="mt-5 flex justify-center">
                    <ImageComponent
                        src={VolunteerIcon}
                        height={100}
                        sizes="100px"
                        alt={t("handsAlt")}
                        title="Icon created by Freepik - Flaticon"
                        className="object-contain"
                    />
                </div>
                {paragraph("p1")}
                <div className="mt-8 flex justify-center">
                    <ImageComponent
                        src={ChildrenIcon}
                        height={100}
                        sizes="100px"
                        alt={t("childrenAlt")}
                        title="Children icons created by Freepik - Flaticon"
                        className="object-contain"
                    />
                </div>
                <div className="flex flex-col gap-5">
                    {paragraph("p2")}
                    {paragraph("p3")}
                </div>
                <div className="mt-8 flex justify-center">
                    <ImageComponent
                        src={DonationIcon}
                        height={100}
                        sizes="100px"
                        alt={t("donationAlt")}
                        title="Food donation icons created by iconixarPro - Flaticon"
                        className="object-contain"
                    />
                </div>
                {paragraph("p4")}
                <p className="mt-8 text-center">
                    <Link href="/directory" className="boh-link break-normal">
                        {tExplore("link")}
                    </Link>
                </p>
            </div>
        </div>
    );
}
