"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    GoogleMap,
    useJsApiLoader,
    MarkerF,
    InfoWindowF,
} from "@react-google-maps/api";

import MapMessage from "@/components/MapMessage";
import {
    MAPS_API_KEY,
    MAP_LOAD_ERROR_TEXT,
    useMapsAuthFailed,
} from "@/utils/googleMaps";

/* Start loading a little before the map scrolls into view */
const LOAD_MARGIN = "200px";

type LocationMapProps = {
    name: string;
    latitude: number;
    longitude: number;
    /* Opens the facility as a named place in Google Maps */
    mapsUrl: string;
    /* Shown instead if the Maps JavaScript API fails, e.g. its key is rejected */
    fallbackEmbedSrc: string | null;
};

function LoadedMap({
    name,
    latitude,
    longitude,
    mapsUrl,
    fallbackEmbedSrc,
}: LocationMapProps) {
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const authFailed = useMapsAuthFailed();
    /* A stable object, since GoogleMap re-centres whenever `center` changes */
    const position = useMemo(
        () => ({ lat: latitude, lng: longitude }),
        [latitude, longitude],
    );

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: MAPS_API_KEY,
    });

    if (loadError || authFailed) {
        if (fallbackEmbedSrc) {
            return (
                <iframe
                    title="Facility location map"
                    width="100%"
                    height="100%"
                    className="border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={fallbackEmbedSrc}
                />
            );
        }

        return <MapMessage text={MAP_LOAD_ERROR_TEXT} />;
    }

    if (!isLoaded) {
        return <MapMessage text="Loading map…" pulse />;
    }

    return (
        <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={position}
            zoom={16}
        >
            <MarkerF
                position={position}
                title={name}
                onClick={() => {
                    setIsInfoOpen(true);
                }}
            />

            {isInfoOpen && (
                <InfoWindowF
                    position={position}
                    onCloseClick={() => {
                        setIsInfoOpen(false);
                    }}
                >
                    <div
                        data-testid="facility-map-infowindow"
                        className="flex flex-col gap-1 py-1"
                    >
                        {/* The named place, which the stored coordinates alone don't give.
                            No coordinate directions link: Google snaps a bare point to the
                            nearest business it knows, so the place's own Directions is used. */}
                        <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-orange-600 hover:underline"
                        >
                            {name} ↗
                        </a>
                    </div>
                </InfoWindowF>
            )}
        </GoogleMap>
    );
}

/* Each Maps JavaScript API load is billed, so the map only loads once it
   (nearly) scrolls into view */
export default function LocationMap(props: LocationMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isNearView, setIsNearView] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || isNearView) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setIsNearView(true);
                }
            },
            { rootMargin: LOAD_MARGIN },
        );
        observer.observe(container);

        return () => {
            observer.disconnect();
        };
    }, [isNearView]);

    return (
        <div
            ref={containerRef}
            data-testid="facility-location-map"
            data-position={`${props.latitude},${props.longitude}`}
            className="h-[300px] w-full overflow-hidden rounded-3xl"
        >
            {isNearView ? (
                <LoadedMap {...props} />
            ) : (
                <MapMessage text="Loading map…" />
            )}
        </div>
    );
}
