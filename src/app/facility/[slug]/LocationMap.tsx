"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    GoogleMap,
    useJsApiLoader,
    MarkerF,
    InfoWindowF,
} from "@react-google-maps/api";

import MapMessage from "@/components/MapMessage";
import { useMapsAuthFailed } from "@/utils/googleMapsAuth";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const LOAD_ERROR_TEXT = "The map could not be loaded. Please try again later.";
/* Start loading a little before the map scrolls into view */
const LOAD_MARGIN = "200px";

type LocationMapProps = {
    name: string;
    latitude: number;
    longitude: number;
    /* Opens the facility as a named place in Google Maps */
    mapsUrl: string;
};

function directionsUrl(latitude: number, longitude: number): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

function LoadedMap({ name, latitude, longitude, mapsUrl }: LocationMapProps) {
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const authFailed = useMapsAuthFailed();
    /* A stable object, since GoogleMap re-centres whenever `center` changes */
    const position = useMemo(
        () => ({ lat: latitude, lng: longitude }),
        [latitude, longitude],
    );

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: API_KEY,
    });

    if (loadError || authFailed) {
        return <MapMessage text={LOAD_ERROR_TEXT} />;
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
                        {/* The named place, which the stored coordinates alone don't give */}
                        <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-orange-600 hover:underline"
                        >
                            {name} ↗
                        </a>
                        {/* Opens the Google Maps app on phones, ready to navigate */}
                        <a
                            href={directionsUrl(latitude, longitude)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-orange-600 hover:underline"
                        >
                            Get directions ↗
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
