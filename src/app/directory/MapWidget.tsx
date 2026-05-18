"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import Link from "next/link";

export type Pin = {
    name: string;
    slug: string;
    city: string;
    lat: number;
    lng: number;
};

const SRI_LANKA_CENTER = { lat: 7.87, lng: 80.77 };
const SESSION_KEY = "directoryMapExpanded";

export default function MapWidget({ pins }: { pins: Pin[] }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);

    useEffect(() => {
        if (sessionStorage.getItem(SESSION_KEY) === "true") {
            setIsExpanded(true);
        }
    }, []);

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

    useEffect(() => {
        if (mapRef.current) {
            fitBounds(mapRef.current);
        }
    }, [fitBounds]);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    });

    const toggle = () => {
        const next = !isExpanded;
        setIsExpanded(next);
        sessionStorage.setItem(SESSION_KEY, String(next));
        if (!next) {
            setSelectedPin(null);
        }
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
                    {isLoaded ? (
                        <GoogleMap
                            mapContainerStyle={{ width: "100%", height: "100%" }}
                            center={SRI_LANKA_CENTER}
                            zoom={8}
                            onLoad={onMapLoad}
                        >
                            {pins.map((pin) => (
                                <Marker
                                    key={pin.slug}
                                    position={{ lat: pin.lat, lng: pin.lng }}
                                    onClick={() => {
                                        setSelectedPin(pin);
                                    }}
                                />
                            ))}

                            {selectedPin && (
                                <InfoWindow
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
                                        <p className="font-semibold">
                                            {selectedPin.name}
                                        </p>
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
                                </InfoWindow>
                            )}
                        </GoogleMap>
                    ) : (
                        <div className="flex h-full w-full animate-pulse items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
                            Loading map…
                        </div>
                    )}
                </div>
            )}

            {/* Visually hidden pin list for Playwright test introspection */}
            <ul data-testid="map-pins-list" className="sr-only">
                {pins.map((pin) => (
                    <li key={pin.slug}>{pin.name}</li>
                ))}
            </ul>
        </div>
    );
}
