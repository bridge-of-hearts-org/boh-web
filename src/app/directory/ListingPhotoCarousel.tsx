"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PhotoEntry } from "@prisma/client";

import ImageComponent from "@/components/ImageComponent";
import { stepIndex, swipeStep } from "@/utils/carousel";
import { photoUrl } from "@/utils/photos";

type ListingPhotoCarouselProps = {
    slug: string;
    name: string;
    photos: PhotoEntry[];
};

/* A facility's photos on its Directory listing, one at a time. The photo links
   to the facility page; the arrows, dots and swipes change the photo. */
export default function ListingPhotoCarousel({
    slug,
    name,
    photos,
}: ListingPhotoCarouselProps) {
    const [index, setIndex] = useState(0);
    const touchStartX = useRef<number | null>(null);
    const count = photos.length;
    const photo = photos[index];

    const step = (by: number) => {
        setIndex((current) => stepIndex(current, by, count));
    };

    const buttonClassName =
        "absolute top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white";

    return (
        <div
            className="relative h-[180px] w-[180px] self-center"
            data-testid="listing-photo-carousel"
            onTouchStart={(e) => {
                touchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
                if (touchStartX.current === null) {
                    return;
                }

                const by = swipeStep(
                    touchStartX.current,
                    e.changedTouches[0].clientX,
                );
                touchStartX.current = null;
                if (by !== 0) {
                    step(by);
                }
            }}
        >
            <Link href={`/facility/${slug}`}>
                <ImageComponent
                    /* A new key per photo restarts the blur-in while it loads */
                    key={photo.fileName}
                    src={photoUrl(slug, photo.fileName)}
                    sizes="180px"
                    width={180}
                    height={180}
                    alt={
                        count > 1
                            ? `Photo ${index + 1} of ${count} taken at ${name}`
                            : `A picture taken at ${name}`
                    }
                    className="h-[180px] w-[180px] object-cover"
                />
            </Link>
            {count > 1 && (
                <>
                    <button
                        type="button"
                        className={`${buttonClassName} left-2`}
                        aria-label="Previous photo"
                        onClick={() => {
                            step(-1);
                        }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        type="button"
                        className={`${buttonClassName} right-2`}
                        aria-label="Next photo"
                        onClick={() => {
                            step(1);
                        }}
                    >
                        <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-2 left-1/2 flex max-w-[160px] -translate-x-1/2 flex-wrap justify-center gap-1.5 rounded-full bg-black/40 px-2 py-1">
                        {photos.map((p, i) => (
                            <button
                                key={p.fileName}
                                type="button"
                                aria-label={`Show photo ${i + 1} of ${count}`}
                                aria-current={i === index}
                                className={`h-2 w-2 rounded-full ${i === index ? "bg-white" : "bg-white/50 hover:bg-white/80"}`}
                                onClick={() => {
                                    setIndex(i);
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
