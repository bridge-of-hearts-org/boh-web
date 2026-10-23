"use client";

import { useState } from "react";

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

    const suggestions = value
        ? options.filter((option) =>
              option.toLowerCase().includes(value.toLowerCase()),
          )
        : options;

    return (
        <div className="relative">
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
                >
                    {suggestions.map((option) => (
                        <li
                            key={option}
                            className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
                            onMouseDown={(e) => {
                                e.preventDefault();
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
