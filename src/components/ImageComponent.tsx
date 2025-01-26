"use client";

import { useState } from "react";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import { Loader } from "lucide-react";

type ImageComponentProps = {
    imageSrc: string;
    containerClasses: string;
    imageSizes: string;
    imageClasses?: string;
    alt?: string;
    onClick?: () => void;
};

export default function ImageComponent(props: ImageComponentProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div
            className={twMerge(
                `relative flex-shrink-0 overflow-hidden rounded-3xl bg-gray-200 ${isLoaded ? "" : "animate-pulse"}`,
                props.containerClasses,
            )}
        >
            {!isLoaded && (
                <div className="flex size-full items-center justify-center">
                    <Loader className="animate-spin" />
                </div>
            )}
            <Image
                src={props.imageSrc}
                fill
                sizes={props.imageSizes}
                loading="lazy"
                alt={props.alt || "Image"}
                className={twMerge(
                    `rounded-3xl object-cover transition-opacity duration-500 ${
                        isLoaded ? "opacity-100" : "opacity-0"
                    }`,
                    props.imageClasses,
                )}
                onClick={props.onClick}
                onLoad={() => setIsLoaded(true)}
            />
        </div>
    );
}
