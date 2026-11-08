"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PhotoEntry } from "@prisma/client";
import { photoUrl } from "@/utils/photos";
import { stepIndex, swipeStep } from "@/utils/carousel";
import { useTranslations } from "next-intl";

import ImageComponent from "@/components/ImageComponent";

type ImageCarouselProps = {
    slug: string;
    photos: PhotoEntry[];
};

export default function ImageCarousel({ slug, photos }: ImageCarouselProps) {
    /* The index of the enlarged photo, or null when none is enlarged */
    const [enlargedIndex, setEnlargedIndex] = useState<number | null>(null);
    const touchStart = useRef<{ x: number; y: number } | null>(null);
    const t = useTranslations("Facility");
    const count = photos.length;

    const closeEnlargedImage = () => {
        setEnlargedIndex(null);
    };

    const stepEnlargedImage = (by: number) => {
        setEnlargedIndex((current) =>
            current === null ? null : stepIndex(current, by, count),
        );
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                closeEnlargedImage();
            } else if (e.key === "ArrowLeft") {
                stepEnlargedImage(-1);
            } else if (e.key === "ArrowRight") {
                stepEnlargedImage(1);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
        /* stepEnlargedImage only depends on count */
    }, [count]);

    const enlargedPhoto = enlargedIndex === null ? null : photos[enlargedIndex];

    const arrowClassName =
        "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white";

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
                {photos.map((photo, idx) => (
                    <ImageComponent
                        key={photo.fileName}
                        src={photoUrl(slug, photo.fileName)}
                        sizes="220px"
                        width={220}
                        height={220}
                        onClick={() => {
                            setEnlargedIndex(idx);
                        }}
                        alt={t("photoAlt")}
                        priority // Mark as priority since the carousel is at the top of the page
                        loading="eager"
                        className="h-[220px] w-[220px] cursor-pointer object-cover"
                    />
                ))}
            </div>
            {enlargedPhoto && enlargedIndex !== null && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
                    onClick={closeEnlargedImage}
                    onTouchStart={(e) => {
                        const touch = e.touches[0];
                        touchStart.current = {
                            x: touch.clientX,
                            y: touch.clientY,
                        };
                    }}
                    onTouchEnd={(e) => {
                        if (touchStart.current === null) {
                            return;
                        }

                        const touch = e.changedTouches[0];
                        const by = swipeStep(touchStart.current, {
                            x: touch.clientX,
                            y: touch.clientY,
                        });
                        touchStart.current = null;
                        if (by !== 0) {
                            stepEnlargedImage(by);
                        }
                    }}
                >
                    <button
                        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40"
                        onClick={closeEnlargedImage}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                    {count > 1 && (
                        <>
                            <button
                                type="button"
                                className={`${arrowClassName} left-2 md:left-6`}
                                aria-label="Previous photo"
                                onClick={(e) => {
                                    /* Don't let the backdrop close the photo */
                                    e.stopPropagation();
                                    stepEnlargedImage(-1);
                                }}
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                type="button"
                                className={`${arrowClassName} right-2 md:right-6`}
                                aria-label="Next photo"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    stepEnlargedImage(1);
                                }}
                            >
                                <ChevronRight size={24} />
                            </button>
                            {/* The photo's alt text already gives its position */}
                            <div
                                aria-hidden="true"
                                className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white"
                            >
                                {enlargedIndex + 1} / {count}
                            </div>
                        </>
                    )}
                    <div className="relative">
                        <ImageComponent
                            /* A new key per photo restarts the blur-in while it loads */
                            key={enlargedPhoto.fileName}
                            src={photoUrl(slug, enlargedPhoto.fileName)}
                            sizes="(max-width: 1024px) 90vw, (max-width: 1768px) 70vw, 50vw"
                            width={1024}
                            height={768}
                            alt={t("photoAltN", {
                                i: enlargedIndex + 1,
                                count,
                            })}
                            /* Photos uploaded from the admin form have no source */
                            title={
                                enlargedPhoto.source
                                    ? t("photoSource", {
                                          source: enlargedPhoto.source,
                                      })
                                    : undefined
                            }
                            className="h-[60vh] w-[80vw] max-w-4xl overflow-hidden rounded-3xl object-contain"
                        />
                    </div>
                </div>
            )}
        </>
    );
}
