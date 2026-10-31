"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import ImageComponent from "@/components/ImageComponent";
import { showsPhotoDots, stepIndex, swipeStep } from "@/utils/carousel";
import { photoUrl } from "@/utils/photos";

type ListingPhotoCarouselProps = {
    slug: string;
    name: string;
    photoFileNames: string[];
};

/* A facility's photos on its Directory listing, one at a time. The photo links
   to the facility page; the arrows, dots and swipes change the photo. */
export default function ListingPhotoCarousel({
    slug,
    name,
    photoFileNames,
}: ListingPhotoCarouselProps) {
    const t = useTranslations("FacilityCard");
    const [index, setIndex] = useState(0);
    const touchStart = useRef<{ x: number; y: number } | null>(null);
    const count = photoFileNames.length;
    const fileName = photoFileNames[index];

    const step = (by: number) => {
        setIndex((current) => stepIndex(current, by, count));
    };

    const arrowClassName =
        "absolute top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white";

    return (
        <div
            className="relative h-[180px] w-[180px] self-center"
            data-testid="listing-photo-carousel"
            onTouchStart={(e) => {
                const touch = e.touches[0];
                touchStart.current = { x: touch.clientX, y: touch.clientY };
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
                    step(by);
                }
            }}
        >
            <Link href={`/facility/${slug}`}>
                <ImageComponent
                    /* A new key per photo restarts the blur-in while it loads */
                    key={fileName}
                    src={photoUrl(slug, fileName)}
                    sizes="180px"
                    width={180}
                    height={180}
                    alt={
                        count > 1
                            ? t("photoAlt", { i: index + 1, count, name })
                            : t("photoAltSingle", { name })
                    }
                    className="h-[180px] w-[180px] object-cover"
                />
            </Link>
            {count > 1 && (
                <>
                    <button
                        type="button"
                        className={`${arrowClassName} left-2`}
                        aria-label="Previous photo"
                        onClick={() => {
                            step(-1);
                        }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        type="button"
                        className={`${arrowClassName} right-2`}
                        aria-label="Next photo"
                        onClick={() => {
                            step(1);
                        }}
                    >
                        <ChevronRight size={20} />
                    </button>
                    {showsPhotoDots(count) && (
                        <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2">
                            {photoFileNames.map((f, i) => (
                                /* A 24px button around each 8px dot, so it is easy to tap */
                                <button
                                    key={f}
                                    type="button"
                                    aria-label={`Show photo ${i + 1} of ${count}`}
                                    aria-current={i === index}
                                    className="group flex h-6 w-6 items-center justify-center"
                                    onClick={() => {
                                        setIndex(i);
                                    }}
                                >
                                    <span
                                        className={`h-2 w-2 rounded-full shadow shadow-black/50 ${i === index ? "bg-white" : "bg-white/60 group-hover:bg-white/90"}`}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                    {!showsPhotoDots(count) && (
                        /* The photo's alt text already gives its position */
                        <div
                            aria-hidden="true"
                            className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white"
                        >
                            {index + 1} / {count}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
