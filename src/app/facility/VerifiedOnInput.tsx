"use client";

import { X } from "lucide-react";

import { parseVerifiedDate, toDateInputValue } from "@/utils/verification";

type PropsType = {
    /* What is being verified, e.g. "0771234567", used for accessible names */
    label: string;
    value: Date | null;
    onChange: (value: Date | null) => void;
};

/* The "Verified on" date for one value in the admin form. An empty date means not verified. */
export default function VerifiedOnInput(props: PropsType) {
    return (
        <span className="flex flex-wrap items-center gap-2 text-sm">
            <span className="whitespace-nowrap text-gray-600">Verified on</span>
            <input
                type="date"
                className="px-2 py-1 text-sm"
                aria-label={`${props.label} verified on`}
                value={toDateInputValue(props.value)}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) =>
                    props.onChange(parseVerifiedDate(e.target.value))
                }
            />
            {props.value && (
                <button
                    type="button"
                    aria-label={`Clear ${props.label} verification`}
                    onClick={() => props.onChange(null)}
                >
                    <X size={16} />
                </button>
            )}
        </span>
    );
}
