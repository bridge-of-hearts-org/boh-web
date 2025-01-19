"use client";

import Button from "@/components/Button";
import { X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function ImageCarousel({ urls }: { urls: string[] }) {
    const [enlargedImage, setEnlargedImage] = useState({
        open: false,
        url: "",
    });

    return (
        <>
            <style>
                {`
                    .carousel-scrollbar::-webkit-scrollbar {
                        height: 10px;
                    }
                `}
            </style>
            <div className="carousel-scrollbar m-10 flex w-full gap-4 overflow-x-auto rounded-xl bg-boh-off-white p-5">
                {urls.map((url) => (
                    <div
                        key={url}
                        className="relative block h-[220px] w-[220px] flex-shrink-0 overflow-hidden rounded-2xl bg-orange-50 hover:cursor-pointer"
                    >
                        <Image
                            onClick={() => {
                                setEnlargedImage({ url: url, open: true });
                            }}
                            key={url}
                            src={url}
                            fill
                            alt="Facility Image"
                        />
                    </div>
                ))}
            </div>
            {enlargedImage.open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
                    onClick={() => {
                        setEnlargedImage({ open: false, url: "" });
                    }}
                >
                    <div
                        className="relative w-4/5 max-w-4xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Enlarged Image */}
                        <Image
                            src={enlargedImage.url}
                            alt="Enlarged"
                            width={1000}
                            height={1000}
                            className="h-auto w-full rounded-lg"
                        />
                        {/* Close Button */}
                        <Button
                            className="absolute right-2 top-2 aspect-square rounded-full bg-opacity-80 hover:bg-opacity-70"
                            variant="primary"
                            color="black"
                            onClick={() => {
                                setEnlargedImage({ open: false, url: "" });
                            }}
                        >
                            <X />
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}
