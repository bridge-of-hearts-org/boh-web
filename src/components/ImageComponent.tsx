"use client";

import React from "react";
import Image, { ImageProps } from "next/image";
import { twMerge } from "tailwind-merge";

export default function ImageComponent({ className, ...props }: ImageProps) {
    const [loading, setLoading] = React.useState(true);

    return (
        <Image
            className={twMerge(
                `rounded-3xl ${loading ? "blur-xl" : "blur-0"} transition-all duration-150`,
                className,
            )}
            onLoad={() => {
                setLoading(false);
            }}
            {...props}
        />
    );
}
