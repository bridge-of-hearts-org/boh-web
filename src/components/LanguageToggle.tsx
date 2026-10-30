"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { usePathname } from "@/i18n/navigation";
import {
    Locale,
    localeNames,
    localizedPath,
    otherLocale,
} from "@/utils/locale";
import { pathWithSearch } from "@/utils/navigation";

type LanguageToggleProps = {
    className?: string;
    onClick?: () => void;
};

/* Link to the given path (without a locale prefix) in the other language.
   Built by hand rather than with the next-intl Link, which links English
   pages as /en/... and relies on a redirect to drop the prefix. */
function ToggleLink({
    href,
    className,
    onClick,
}: LanguageToggleProps & { href: string }) {
    const t = useTranslations("LanguageToggle");
    const target = otherLocale(useLocale() as Locale);

    return (
        <Link
            href={localizedPath(target, href)}
            hrefLang={target}
            lang={target}
            aria-label={t("label")}
            data-testid="language-toggle"
            className={className}
            onClick={onClick}
        >
            {localeNames[target]}
        </Link>
    );
}

/* Keeps the search params, so directory filters and the page number
   survive the switch */
function ToggleWithSearchParams(props: LanguageToggleProps) {
    const href = pathWithSearch(usePathname(), useSearchParams().toString());

    return <ToggleLink href={href} {...props} />;
}

function ToggleWithoutSearchParams(props: LanguageToggleProps) {
    return <ToggleLink href={usePathname()} {...props} />;
}

export default function LanguageToggle(props: LanguageToggleProps) {
    return (
        <Suspense fallback={<ToggleWithoutSearchParams {...props} />}>
            <ToggleWithSearchParams {...props} />
        </Suspense>
    );
}
