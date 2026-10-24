"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
    GoogleMap,
    useJsApiLoader,
    MarkerF,
    InfoWindowF,
} from "@react-google-maps/api";
import Link from "next/link";

import MapMessage from "@/components/MapMessage";
import { FacilityPin } from "@/utils/defines";
import {
    MAPS_API_KEY,
    MAP_LOAD_ERROR_TEXT,
    directionsUrl,
    useMapsAuthFailed,
} from "@/utils/googleMaps";

const SRI_LANKA_CENTER = { lat: 7.87, lng: 80.77 };
const SESSION_KEY = "directoryMapExpanded";
/* Stops fitting a single pin or a tight cluster from zooming to street level */
const MAX_FIT_ZOOM = 14;

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

const FIT_PADDING = 40;

/* Whether the bounds fit in the map's container at the given zoom, using the
   Web Mercator projection Google Maps uses (256px world at zoom 0) */
function fitsAtZoom(
    map: google.maps.Map,
    bounds: google.maps.LatLngBounds,
    zoom: number,
): boolean {
    const scale = 256 * 2 ** zoom;
    const toX = (lng: number) => ((lng + 180) / 360) * scale;
    const toY = (lat: number) => {
        const sin = Math.sin((lat * Math.PI) / 180);
        return (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
    };
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const div = map.getDiv();
    return (
        toX(ne.lng()) - toX(sw.lng()) <= div.clientWidth - 2 * FIT_PADDING &&
        toY(sw.lat()) - toY(ne.lat()) <= div.clientHeight - 2 * FIT_PADDING
    );
}

function fitToPins(map: google.maps.Map, pins: FacilityPin[]) {
    if (pins.length === 0) {
        map.setCenter(SRI_LANKA_CENTER);
        map.setZoom(8);
        return;
    }
    const bounds = new google.maps.LatLngBounds();
    pins.forEach((p) => {
        bounds.extend({ lat: p.lat, lng: p.lng });
    });
    /* fitBounds would zoom a single pin or tight cluster to street level, so
       centre at the zoom cap instead when everything already fits there */
    if (fitsAtZoom(map, bounds, MAX_FIT_ZOOM)) {
        map.setCenter(bounds.getCenter());
        map.setZoom(MAX_FIT_ZOOM);
    } else {
        map.fitBounds(bounds, FIT_PADDING);
    }
}

/* Mounted on first expand and then kept (hidden while collapsed), so the Maps
   script loads on demand and re-opening the map isn't a new billable map load */
function FacilityMap({
    pins,
    isVisible,
}: {
    pins: FacilityPin[];
    isVisible: boolean;
}) {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedPin, setSelectedPin] = useState<FacilityPin | null>(null);
    const fittedPinsKey = useRef<string | null>(null);
    const authFailed = useMapsAuthFailed();

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: MAPS_API_KEY,
    });

    /* The server sends a new pins array on every navigation; only the set of
       facilities matters, so paging or sorting keeps the user's pan and zoom */
    const pinsKey = useMemo(() => pins.map((p) => p.slug).join(","), [pins]);

    /* Fitting while hidden would use a zero-size container, so wait until visible */
    useEffect(() => {
        if (!map || !isVisible || fittedPinsKey.current === pinsKey) {
            return;
        }
        fittedPinsKey.current = pinsKey;
        fitToPins(map, pins);
    }, [map, isVisible, pinsKey, pins]);

    const onMapUnmount = useCallback(() => {
        setMap(null);
    }, []);

    /* Hide the popup if a filter change removed its facility */
    const shownPin =
        selectedPin && pins.some((p) => p.slug === selectedPin.slug)
            ? selectedPin
            : null;

    if (loadError || authFailed) {
        return <MapMessage text={MAP_LOAD_ERROR_TEXT} />;
    }

    if (!isLoaded) {
        return <MapMessage text="Loading map…" pulse />;
    }

    return (
        <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={SRI_LANKA_CENTER}
            zoom={8}
            onLoad={setMap}
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

            {shownPin && (
                <InfoWindowF
                    position={{
                        lat: shownPin.lat,
                        lng: shownPin.lng,
                    }}
                    onCloseClick={() => {
                        setSelectedPin(null);
                    }}
                >
                    <div
                        data-testid="map-infowindow"
                        className="flex flex-col gap-1 py-1"
                    >
                        <p className="font-semibold">{shownPin.name}</p>
                        <p className="text-sm text-gray-600">{shownPin.city}</p>
                        <Link
                            href={`/facility/${shownPin.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-orange-600 hover:underline"
                        >
                            More Info →
                        </Link>
                        {/* Opens the Google Maps app on phones, ready to navigate */}
                        <a
                            href={directionsUrl(shownPin.lat, shownPin.lng)}
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

export default function MapWidget({ pins }: { pins: FacilityPin[] }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasOpened, setHasOpened] = useState(false);

    useEffect(() => {
        if (readExpanded()) {
            setIsExpanded(true);
            setHasOpened(true);
        }
    }, []);

    const toggle = () => {
        const next = !isExpanded;
        setIsExpanded(next);
        if (next) {
            setHasOpened(true);
        }
        writeExpanded(next);
    };

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={toggle}
                aria-expanded={isExpanded}
                aria-controls="directory-map"
                className="flex w-fit items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
            >
                {isExpanded ? "Hide Map ▴" : "Show Map ▾"}
            </button>

            {hasOpened && (
                <div
                    id="directory-map"
                    data-testid="directory-map"
                    className={`h-96 w-full overflow-hidden rounded-xl border border-gray-200 ${isExpanded ? "" : "hidden"}`}
                >
                    {MAPS_API_KEY ? (
                        <FacilityMap pins={pins} isVisible={isExpanded} />
                    ) : (
                        <MapMessage text="The map is currently unavailable." />
                    )}
                </div>
            )}
        </div>
    );
}
