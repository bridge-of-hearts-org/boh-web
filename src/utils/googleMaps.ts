import { useSyncExternalStore } from "react";

/* Shared by the client-side maps (the directory map and the facility page map) */

export const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
export const MAP_LOAD_ERROR_TEXT =
    "The map could not be loaded. Please try again later.";

/* Opens the Google Maps app on phones, ready to navigate */
export function directionsUrl(latitude: number, longitude: number): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

declare global {
    interface Window {
        /* Called by Google Maps when the API key is rejected */
        gm_authFailure?: () => void;
    }
}

/* Google reports a rejected key only once per script load, so remember it at
   module level for maps mounted later (e.g. after navigating back). Shared by
   every client-side map, since Google calls a single global handler. */
let mapsAuthFailed = false;
const authFailureListeners = new Set<() => void>();

if (typeof window !== "undefined") {
    window.gm_authFailure = () => {
        mapsAuthFailed = true;
        authFailureListeners.forEach((listener) => {
            listener();
        });
    };
}

function subscribeAuthFailure(listener: () => void) {
    authFailureListeners.add(listener);
    return () => {
        authFailureListeners.delete(listener);
    };
}

/* Whether Google Maps has rejected the API key */
export function useMapsAuthFailed(): boolean {
    return useSyncExternalStore(
        subscribeAuthFailure,
        () => mapsAuthFailed,
        () => false,
    );
}
