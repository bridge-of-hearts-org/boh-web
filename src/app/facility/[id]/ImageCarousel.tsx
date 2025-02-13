"use client";

import { useState } from "react";
import ImageComponent from "@/components/ImageComponent";
import { PhotoEntry } from "@prisma/client";
import { vercelStorageUrl } from "@/utils/defines";

type ImageCarouselProps = {
    id: string;
    photos: PhotoEntry[];
};

export default function ImageCarousel({ id, photos }: ImageCarouselProps) {
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
                        imageSrc={`${vercelStorageUrl}/${id}/${photo.fileName}`}
                        containerClasses="h-[220px] w-[220px] shadow-md flex-shrink-0 cursor-pointer"
                        imageSizes="220px"
                        imageClasses="object-cover"
                        onClick={() => {
                            setEnlargedImage({ photo: photo, open: true });
                        }}
                        alt="A picture taken at the children's home facility"
                        priority // Mark as priority since the carousel is at the top of the page
                    />
                ))}
            </div>
            {enlargedImage.open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
                    onClick={() => {
                        setEnlargedImage({
                            open: false,
                            photo: {
                                fileName: "",
                                source: "",
                            },
                        });
                    }}
                >
                    <div className="relative">
                        <ImageComponent
                            imageSrc={`${vercelStorageUrl}/${id}/${enlargedImage.photo.fileName}`}
                            containerClasses="h-[60vh] w-[80vw] max-w-4xl bg-transparent bg-opacity-70 rounded-none"
                            imageClasses="object-contain rounded-none"
                            imageSizes="(max-width: 1024px) 100vw, (max-width: 1768px) 70vw, 30vw"
                            alt="A picture taken at the children's home facility"
                            title={`Source: ${enlargedImage.photo.source}`}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
