"use client";

import { useEffect, useRef, useState } from "react";

type AutocompleteInputProps = {
    id: string;
    name: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
};

/**
 * Text input that shows a dropdown of matching options on focus.
 * Matching is case-insensitive and the option may contain the input anywhere.
 */
export default function AutocompleteInput({
    id,
    name,
    value,
    options,
    onChange,
}: AutocompleteInputProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close on any tap or click outside. onBlur alone isn't enough on iOS
    // Safari, where tapping a non-focusable area may not blur the input.
    useEffect(() => {
        if (!showSuggestions) {
            return;
        }

        function handlePointerDown(e: PointerEvent) {
            if (!wrapperRef.current?.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        }

        document.addEventListener("pointerdown", handlePointerDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
        };
    }, [showSuggestions]);

    const suggestions = value
        ? options.filter((option) =>
              option.toLowerCase().includes(value.toLowerCase()),
          )
        : options;

    return (
        <div ref={wrapperRef} className="relative">
            <input
                id={id}
                name={name}
                type="text"
                autoComplete="off"
                className="w-full"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                // Reopen when the already-focused input is tapped again
                onClick={() => setShowSuggestions(true)}
                onBlur={() => setShowSuggestions(false)}
                onKeyDown={(e) => {
                    if (e.key === "Escape") {
                        setShowSuggestions(false);
                    }
                }}
            />
            {showSuggestions && suggestions.length > 0 && (
                <ul
                    id={`${id}-suggestions`}
                    className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-md"
                    // Keep focus on the input when clicking the list or its scrollbar
                    onMouseDown={(e) => {
                        e.preventDefault();
                    }}
                >
                    {suggestions.map((option) => (
                        <li
                            key={option}
                            className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
                            onMouseDown={(e) => {
                                // Only select on a primary (left) click or tap
                                if (e.button !== 0) {
                                    return;
                                }
                                onChange(option);
                                setShowSuggestions(false);
                            }}
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
