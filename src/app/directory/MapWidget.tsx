"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    GoogleMap,
    useJsApiLoader,
    MarkerF,
    InfoWindowF,
} from "@react-google-maps/api";
import Link from "next/link";

import { FacilityPin } from "@/utils/defines";

const SRI_LANKA_CENTER = { lat: 7.87, lng: 80.77 };
const SESSION_KEY = "directoryMapExpanded";
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

/* sessionStorage can throw when storage is blocked; the map then just starts collapsed */
function readExpanded(): boolean {
    try {
        return sessionStorage.getItem(SESSION_KEY) === "true";
    } catch {
        return false;
    }
}

function writeExpanded(value: boolean) {
    try {
        sessionStorage.setItem(SESSION_KEY, String(value));
    } catch {
        // Ignore: persistence is a convenience only
    }
}

function MapMessage({ text, pulse }: { text: string; pulse?: boolean }) {
    return (
        <div
            className={`flex h-full w-full items-center justify-center rounded-xl bg-gray-100 px-4 text-center text-sm text-gray-500 ${pulse ? "animate-pulse" : ""}`}
        >
            {text}
        </div>
    );
}

/* Only mounted while the map is expanded, so the Maps script loads on demand */
function FacilityMap({ pins }: { pins: FacilityPin[] }) {
    const [selectedPin, setSelectedPin] = useState<FacilityPin | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: API_KEY,
    });

    const fitBounds = useCallback(
        (map: google.maps.Map) => {
            if (pins.length === 0) {
                map.setCenter(SRI_LANKA_CENTER);
                map.setZoom(8);
                return;
            }
            const bounds = new google.maps.LatLngBounds();
            pins.forEach((p) => {
                bounds.extend({ lat: p.lat, lng: p.lng });
            });
            map.fitBounds(bounds, 40);
        },
        [pins],
    );

    const onMapLoad = useCallback(
        (map: google.maps.Map) => {
            mapRef.current = map;
            fitBounds(map);
        },
        [fitBounds],
    );

    const onMapUnmount = useCallback(() => {
        mapRef.current = null;
    }, []);

    useEffect(() => {
        if (mapRef.current) {
            fitBounds(mapRef.current);
        }
    }, [fitBounds]);

    if (loadError) {
        return (
            <MapMessage text="The map could not be loaded. Please try again later." />
        );
    }

    if (!isLoaded) {
        return <MapMessage text="Loading map…" pulse />;
    }

    return (
        <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={SRI_LANKA_CENTER}
            zoom={8}
            onLoad={onMapLoad}
            onUnmount={onMapUnmount}
        >
            {pins.map((pin) => (
                <MarkerF
                    key={pin.slug}
                    position={{ lat: pin.lat, lng: pin.lng }}
                    title={pin.name}
                    onClick={() => {
                        setSelectedPin(pin);
                    }}
                />
            ))}

            {selectedPin && (
                <InfoWindowF
                    position={{
                        lat: selectedPin.lat,
                        lng: selectedPin.lng,
                    }}
                    onCloseClick={() => {
                        setSelectedPin(null);
                    }}
                >
                    <div
                        data-testid="map-infowindow"
                        className="flex flex-col gap-1 py-1"
                    >
                        <p className="font-semibold">{selectedPin.name}</p>
                        <p className="text-sm text-gray-600">
                            {selectedPin.city}
                        </p>
                        <Link
                            href={`/facility/${selectedPin.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-orange-600 hover:underline"
                        >
                            More Info →
                        </Link>
                    </div>
                </InfoWindowF>
            )}
        </GoogleMap>
    );
}

export default function MapWidget({ pins }: { pins: FacilityPin[] }) {
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (readExpanded()) {
            setIsExpanded(true);
        }
    }, []);

    const toggle = () => {
        const next = !isExpanded;
        setIsExpanded(next);
        writeExpanded(next);
    };

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={toggle}
                className="flex w-fit items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
            >
                {isExpanded ? "Hide Map ▴" : "Show Map ▾"}
            </button>

            {isExpanded && (
                <div
                    data-testid="directory-map"
                    className="h-96 w-full overflow-hidden rounded-xl border border-gray-200"
                >
                    {API_KEY ? (
                        <FacilityMap pins={pins} />
                    ) : (
                        <MapMessage text="The map is currently unavailable." />
                    )}
                </div>
            )}
        </div>
    );
}
