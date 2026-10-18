/* Helpers for extracting coordinates from Google Maps URLs.
    Shared by the admin edit form (via a server action) and scripts/syncFacilities.ts,
    so this file must not use path aliases or Next.js-specific imports. */

export type LatLng = { latitude: number; longitude: number };

const GOOGLE_MAPS_HOSTS = ["maps.app.goo.gl", "goo.gl", "maps.google.com", "google.com", "consent.google.com"];

/* Sri Lanka's rough bounding box, used to warn about coordinates that are likely wrong */
const SRI_LANKA_BOUNDS = { minLat: 5.9, maxLat: 9.9, minLng: 79.5, maxLng: 81.9 };

function parseUrl(url: string): URL | null {
    try {
        return new URL(url);
    } catch {
        return null;
    }
}

export function isGoogleMapsUrl(url: string): boolean {
    const parsed = parseUrl(url.trim());
    if (!parsed || (parsed.protocol !== "https:" && parsed.protocol !== "http:")) {
        return false;
    }

    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (!GOOGLE_MAPS_HOSTS.includes(host)) {
        return false;
    }

    /* google.com and goo.gl host other services, so only accept their maps paths */
    if (host === "google.com" || host === "goo.gl") {
        return parsed.pathname.startsWith("/maps");
    }

    return true;
}

/* When the request comes from outside Sri Lanka (e.g. an EU server), Google may redirect
    to a cookie consent page that carries the real Maps URL in its `continue` param. */
function unwrapConsentUrl(url: string): string {
    const parsed = parseUrl(url);
    if (parsed?.hostname === "consent.google.com") {
        const target = parsed.searchParams.get("continue");
        if (target) {
            return target;
        }
    }

    return url;
}

function toLatLng(lat: string, lng: string): LatLng | null {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
        return null;
    }

    return { latitude, longitude };
}

/* Parses coordinates from an already-resolved (non-shortlink) Google Maps URL */
export function parseLatLngFromUrl(url: string): LatLng | null {
    let decoded = unwrapConsentUrl(url);
    try {
        decoded = decodeURIComponent(decoded);
    } catch {}

    const num = "(-?\\d+(?:\\.\\d+)?)";

    // Pattern: !3dlat!4dlng — the place pin itself (e.g. .../data=!4m6!3m5!...!3d7.2906!4d80.6337)
    const pinMatch = decoded.match(new RegExp(`!3d${num}!4d${num}`));
    if (pinMatch) {
        const coords = toLatLng(pinMatch[1], pinMatch[2]);
        if (coords) {
            return coords;
        }
    }

    // Pattern: /@lat,lng,zoom — the map view centre (e.g. google.com/maps/place/.../@7.2906,80.6337,17z)
    const atMatch = decoded.match(new RegExp(`@${num},${num}`));
    if (atMatch) {
        const coords = toLatLng(atMatch[1], atMatch[2]);
        if (coords) {
            return coords;
        }
    }

    // Pattern: ?q=lat,lng (e.g. maps.google.com/maps?q=7.2906,80.6337)
    const qMatch = decoded.match(new RegExp(`[?&](?:q|query|ll)=${num},[\\s+]*${num}`));
    if (qMatch) {
        const coords = toLatLng(qMatch[1], qMatch[2]);
        if (coords) {
            return coords;
        }
    }

    return null;
}

/* Resolves shortlinks (following redirects) and extracts coordinates.
    `resolvedUrl` is the full Maps URL after redirects, with any consent page unwrapped. */
export async function extractLatLng(
    url: string,
): Promise<(LatLng & { resolvedUrl: string }) | null> {
    let resolvedUrl = url;

    const host = parseUrl(url)?.hostname.toLowerCase();
    if (host === "maps.app.goo.gl" || host === "goo.gl") {
        try {
            const resp = await fetch(url, { redirect: "follow" });
            resolvedUrl = resp.url;
        } catch {
            return null;
        }
    }

    resolvedUrl = unwrapConsentUrl(resolvedUrl);

    const coords = parseLatLngFromUrl(resolvedUrl);
    if (!coords) {
        return null;
    }

    return { ...coords, resolvedUrl };
}

export function isValidLatitude(value: number): boolean {
    return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number): boolean {
    return Number.isFinite(value) && value >= -180 && value <= 180;
}

export function isInSriLanka({ latitude, longitude }: LatLng): boolean {
    return (
        latitude >= SRI_LANKA_BOUNDS.minLat &&
        latitude <= SRI_LANKA_BOUNDS.maxLat &&
        longitude >= SRI_LANKA_BOUNDS.minLng &&
        longitude <= SRI_LANKA_BOUNDS.maxLng
    );
}
