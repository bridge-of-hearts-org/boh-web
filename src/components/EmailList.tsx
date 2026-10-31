import { VerifiedValue } from "@prisma/client";
import { useTranslations } from "next-intl";

import VerifiedBadge from "@/components/VerifiedBadge";
import { findVerifiedDate } from "@/utils/verification";

type PropsType = {
    emails: string[];
    /* Shows a checkmark next to each verified email */
    verified?: VerifiedValue[];
};

export default function EmailList(props: PropsType) {
    const t = useTranslations("Verified");

    return (
        <span>
            {props.emails.length == 0 && "-"}
            {props.emails.length > 0 && (
                <div className="flex flex-col gap-2">
                    {props.emails.map((email, idx) => {
                        const verifiedAt = findVerifiedDate(
                            props.verified,
                            email,
                        );

                        return (
                            <span key={email}>
                                <a
                                    href={`mailto:${email}`}
                                    className="boh-link"
                                >
                                    {email}
                                </a>
                                {verifiedAt && (
                                    <VerifiedBadge
                                        label={t("email", { email })}
                                        verifiedAt={verifiedAt}
                                    />
                                )}
                            </span>
                        );
                    })}
                </div>
            )}
        </span>
    );
}
