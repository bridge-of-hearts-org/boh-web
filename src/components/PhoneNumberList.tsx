import { VerifiedValue } from "@prisma/client";
import { useTranslations } from "next-intl";

import VerifiedBadge from "@/components/VerifiedBadge";
import { findVerifiedDate } from "@/utils/verification";

type PropsType = {
    numbers: string[];
    orientation: "row" | "column";
    /* Shows a checkmark next to each verified number */
    verified?: VerifiedValue[];
};

export default function PhoneNumberList(props: PropsType) {
    const t = useTranslations("Verified");

    return (
        <span>
            {props.numbers.length == 0 && "-"}
            {props.numbers.length > 0 && (
                <div
                    className={`flex gap-1 ${props.orientation == "column" ? "flex-col" : "flex-wrap"}`}
                >
                    {props.numbers.map((number, idx) => {
                        const verifiedAt = findVerifiedDate(
                            props.verified,
                            number,
                        );

                        return (
                            <span key={number}>
                                <a
                                    href={`tel:${number}`}
                                    className="underline- hover:underline"
                                >
                                    {number.substring(0, 3) +
                                        "-" +
                                        number.substring(3)}
                                </a>
                                {verifiedAt && (
                                    <VerifiedBadge
                                        label={t("phone", { number })}
                                        verifiedAt={verifiedAt}
                                    />
                                )}
                                {props.orientation == "row" &&
                                    idx < props.numbers.length - 1 &&
                                    " / "}
                            </span>
                        );
                    })}
                </div>
            )}
        </span>
    );
}
