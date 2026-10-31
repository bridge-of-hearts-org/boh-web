import Button from "@/components/Button";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export default function NotFound() {
    const t = useTranslations("NotFound");

    return (
        <div className="mt-10 flex flex-col items-center justify-center gap-10">
            <h2 className="text-2xl font-semibold">{t("title")}</h2>
            <Link href="/">
                <Button name="Return Home" variant="secondary" color="black">
                    Return Home
                </Button>
            </Link>
        </div>
    );
}
