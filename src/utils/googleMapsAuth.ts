import { useSyncExternalStore } from "react";

declare global {
    interface Window {
        /* Called by Google Maps when the API key is rejected */
        gm_authFailure?: () => void;
    }
}

/* Google reports a rejected key only once per script load, so remember it at
   module level for maps mounted later (e.g. after navigating back). Shared by
   every map on the site, since Google calls a single global handler. */
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
