"use client";

import { useState } from "react";
import ImageComponent from "@/components/ImageComponent";

export default function ImageCarousel({ urls }: { urls: string[] }) {
    const [enlargedImage, setEnlargedImage] = useState({
        open: false,
        url: "",
    });

    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <>
            <style>
                {`
                    .carousel-scrollbar::-webkit-scrollbar {
                        height: 10px;
                    }
                `}
            </style>
            <div className="carousel-scrollbar m-10 flex w-full gap-4 overflow-x-auto rounded-3xl bg-boh-off-white p-5">
                {urls.map((url) => (
                    <ImageComponent
                        key={url}
                        imageSrc={url}
                        containerClasses="h-[220px] w-[220px] shadow-md flex-shrink-0 cursor-pointer"
                        imageSizes="220px"
                        imageClasses="object-cover"
                        onClick={() => {
                            setEnlargedImage({ url: url, open: true });
                        }}
                        alt="Facility Image"
                        priority // Mark as priority since the carousel is at the top of the page
                    />
                ))}
            </div>
            {enlargedImage.open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
                    onClick={() => {
                        setEnlargedImage({ open: false, url: "" });
                    }}
                >
                    <div className="relative">
                        <ImageComponent
                            imageSrc={enlargedImage.url}
                            containerClasses="h-[60vh] w-[80vw] max-w-4xl bg-transparent bg-opacity-70 rounded-none"
                            imageClasses="object-contain rounded-none"
                            imageSizes="(max-width: 1024px) 100vw, (max-width: 1768px) 70vw, 30vw"
                            alt="Facility Image Enlarged"
                        />
                    </div>
                </div>
            )}
        </>
    );
}
