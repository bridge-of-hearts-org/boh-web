"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useLocale, useTranslations } from "next-intl";

import { Locale } from "@/utils/locale";
import { formatVerifiedDate } from "@/utils/verification";

type PropsType = {
    /* What was verified, read by screen readers, e.g. "Phone number 0771234567" */
    label: string;
    verifiedAt: Date;
    /* Which edge of the checkmark the note lines up with. "end" suits values
        near the right side of the page, "start" values near the left. */
    align?: "start" | "end";
};

/* A filled green badge check that opens a note saying when the value was verified */
export default function VerifiedBadge(props: PropsType) {
    const t = useTranslations("Verified");
    const locale = useLocale() as Locale;
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const popoverId = useId();

    /* Clicking or tabbing anywhere else closes it, which also closes it when
        another badge is opened, so only one is open at a time */
    useEffect(() => {
        if (!open) {
            return;
        }

        const isOutside = (target: EventTarget | null) =>
            !wrapperRef.current?.contains(target as Node);

        const handlePointerDown = (e: PointerEvent) => {
            if (isOutside(e.target)) {
                setOpen(false);
            }
        };
        const handleFocusIn = (e: FocusEvent) => {
            if (isOutside(e.target)) {
                setOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("focusin", handleFocusIn);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("focusin", handleFocusIn);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    return (
        <span ref={wrapperRef} className="relative inline-flex align-middle">
            {/* The padding gives the small icon a comfortable tap target; the
                negative margin keeps it from changing the line height */}
            <button
                type="button"
                className="-my-1.5 rounded-full p-1.5 text-green-600 hover:bg-green-50"
                aria-label={t("label", { label: props.label })}
                aria-expanded={open}
                aria-controls={popoverId}
                onClick={() => setOpen(!open)}
            >
                <BadgeCheck
                    size={18}
                    className="fill-green-600 text-white"
                    aria-hidden="true"
                />
            </button>
            {/* Always rendered, so aria-controls points at it while it's hidden */}
            <span
                id={popoverId}
                hidden={!open}
                /* It can cover the next row's checkmark, so a tap dismisses it */
                onClick={() => setOpen(false)}
                className={twMerge(
                    "absolute top-full z-20 mt-1 w-56 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white p-3 text-left text-sm font-normal not-italic shadow-lg",
                    props.align === "start" ? "left-0" : "right-0",
                )}
            >
                {t("popover", {
                    date: formatVerifiedDate(props.verifiedAt, locale),
                })}
            </span>
        </span>
    );
}
