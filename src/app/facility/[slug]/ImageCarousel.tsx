"use client";

import { useState, useEffect } from "react";
import { PhotoEntry } from "@prisma/client";
import { vercelStorageUrl } from "@/utils/defines";
import ImageComponent from "@/components/ImageComponent";

type ImageCarouselProps = {
    slug: string;
    photos: PhotoEntry[];
};

export default function ImageCarousel({ slug, photos }: ImageCarouselProps) {
    const [enlargedImage, setEnlargedImage] = useState<{
        open: boolean;
        photo: PhotoEntry;
    }>({
        open: false,
        photo: {
            fileName: "",
            source: "",
        },
    });

    const closeEnlargedImage = () => {
        setEnlargedImage({ open: false, photo: { fileName: "", source: "" } });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeEnlargedImage();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

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
                {photos.map((photo) => (
                    <ImageComponent
                        key={photo.fileName}
                        src={`${vercelStorageUrl}/${slug}/${photo.fileName}`}
                        sizes="220px"
                        width={220}
                        height={220}
                        onClick={() => {
                            setEnlargedImage({ photo: photo, open: true });
                        }}
                        alt="A picture taken at the children's home facility"
                        priority // Mark as priority since the carousel is at the top of the page
                        loading="eager"
                        className="h-[220px] w-[220px] cursor-pointer object-cover"
                    />
                ))}
            </div>
            {enlargedImage.open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
                    onClick={closeEnlargedImage}
                >
                    <button
                        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40"
                        onClick={closeEnlargedImage}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                    <div className="relative">
                        <ImageComponent
                            src={`${vercelStorageUrl}/${slug}/${enlargedImage.photo.fileName}`}
                            sizes="(max-width: 1024px) 90vw, (max-width: 1768px) 70vw, 50vw"
                            width={1024}
                            height={768}
                            alt="A picture taken at the children's home facility"
                            title={`Source: ${enlargedImage.photo.source}`}
                            className="h-[60vh] w-[80vw] max-w-4xl overflow-hidden rounded-3xl object-contain"
                        />
                    </div>
                </div>
            )}
        </>
    );
}
