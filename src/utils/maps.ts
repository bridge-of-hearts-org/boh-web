/* Helpers for extracting coordinates from Google Maps URLs.
    Shared by the admin edit form (via a server action) and scripts/syncFacilities.ts,
    so this file must not use path aliases or Next.js-specific imports. */

export type LatLng = { latitude: number; longitude: number };

/* Shortlink hosts. These are the only hosts that are ever fetched. */
const SHORTLINK_HOSTS = ["maps.app.goo.gl", "goo.gl"];

/* google.com, google.lk, google.co.uk, google.com.au etc. with an optional www./maps. prefix */
const GOOGLE_HOST_PATTERN =
    /^(?:www\.|maps\.)?google\.(?:com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/;

const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 5000;

/* Sri Lanka's rough bounding box, used to warn about coordinates that are likely wrong */
const SRI_LANKA_BOUNDS = {
    minLat: 5.9,
    maxLat: 9.9,
    minLng: 79.5,
    maxLng: 81.9,
};

function parseUrl(url: string): URL | null {
    try {
        return new URL(url);
    } catch {
        return null;
    }
}

function isMapsPath(pathname: string): boolean {
    return pathname === "/maps" || pathname.startsWith("/maps/");
}

function isShortlink(parsed: URL): boolean {
    const host = parsed.hostname.toLowerCase();

    if (host === "goo.gl") {
        return isMapsPath(parsed.pathname);
    }

    return SHORTLINK_HOSTS.includes(host);
}

/* Accepts Google Maps shortlinks and Google Maps URLs on any Google country domain */
export function isGoogleMapsUrl(url: string): boolean {
    const parsed = parseUrl(url.trim());
    if (!parsed || parsed.protocol !== "https:") {
        return false;
    }

    if (isShortlink(parsed)) {
        return true;
    }

    const host = parsed.hostname.toLowerCase();
    if (!GOOGLE_HOST_PATTERN.test(host)) {
        return false;
    }

    /* google.<tld> hosts other services, so only accept its maps paths */
    return host.startsWith("maps.") || isMapsPath(parsed.pathname);
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
    } catch {
        /* Malformed escape sequences: match against the raw URL instead */
    }

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
    const qMatch = decoded.match(
        new RegExp(`[?&](?:q|query|ll)=${num},[\\s+]*${num}`),
    );
    if (qMatch) {
        const coords = toLatLng(qMatch[1], qMatch[2]);
        if (coords) {
            return coords;
        }
    }

    // Pattern: /maps/search/lat,+lng — a searched coordinate or dropped pin
    // (e.g. google.com/maps/search/7.2906,+80.6337)
    const searchMatch = decoded.match(
        new RegExp(`/maps/search/${num},[\\s+]*${num}`),
    );
    if (searchMatch) {
        const coords = toLatLng(searchMatch[1], searchMatch[2]);
        if (coords) {
            return coords;
        }
    }

    return null;
}

/* Expands a shortlink by following its redirects one hop at a time. Only shortlink hosts are
    fetched: as soon as a redirect points anywhere else, that URL is returned without fetching it. */
async function expandShortlink(url: string): Promise<string | null> {
    let current = url;

    for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
        const parsed = parseUrl(current);
        if (
            !parsed ||
            !["https:", "http:"].includes(parsed.protocol) ||
            !isShortlink(parsed)
        ) {
            return current;
        }

        let location: string | null;
        try {
            const resp = await fetch(current, {
                redirect: "manual",
                signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            });
            await resp.body?.cancel();
            location = resp.headers.get("location");
        } catch {
            return null;
        }

        if (!location) {
            return null;
        }

        current = new URL(location, current).toString();
    }

    return null;
}

/* Resolves shortlinks and extracts coordinates.
    `resolvedUrl` is the full Maps URL after redirects, with any consent page unwrapped. */
export async function extractLatLng(
    url: string,
): Promise<(LatLng & { resolvedUrl: string }) | null> {
    const expanded = await expandShortlink(url);
    if (!expanded) {
        return null;
    }

    const unwrapped = unwrapConsentUrl(expanded);

    const coords = parseLatLngFromUrl(unwrapped);
    if (!coords) {
        return null;
    }

    /* The redirect target is stored as the facility's Maps URL, so only use it
        if it is a Google Maps URL; otherwise keep the URL as entered */
    const resolvedUrl = isGoogleMapsUrl(unwrapped) ? unwrapped : url;

    return { ...coords, resolvedUrl };
}

export function isValidLatitude(value: number): boolean {
    return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number): boolean {
    return Number.isFinite(value) && value >= -180 && value <= 180;
}

/* Whether a facility has usable coordinates. Facilities created before the
    lat/lng fields existed were saved with 0, 0, which means "unknown". */
export function hasCoordinates(location: {
    latitude: number | null;
    longitude: number | null;
}): location is { latitude: number; longitude: number } {
    const { latitude, longitude } = location;

    return (
        latitude !== null &&
        longitude !== null &&
        !(latitude === 0 && longitude === 0)
    );
}

/* Link for opening a facility in Google Maps. Prefer the stored Maps URL, which
    opens the named place; a search for the coordinates only opens a bare point
    (and directions to one snap to the nearest business Google knows). */
export function buildOpenInMapsUrl(location: {
    google: string;
    latitude: number | null;
    longitude: number | null;
}): string | null {
    if (isGoogleMapsUrl(location.google)) {
        return location.google.trim();
    }

    if (hasCoordinates(location)) {
        return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    }

    return null;
}

/* Embed URL for the facility page's static map, or null without the embed API key */
export function buildMapEmbedSrc(location: {
    google: string;
    latitude: number | null;
    longitude: number | null;
}): string | null {
    const apiKey = process.env.GOOGLE_MAPS_EMBED_API_KEY;
    if (!apiKey) {
        return null;
    }

    /* Read before the hasCoordinates guard, which narrows `location` to never in its else branch */
    const { google } = location;

    /* Prefer the stored coordinates: a name search can match an unrelated
        place with the same name (e.g. in another country) */
    if (hasCoordinates(location)) {
        return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${location.latitude},${location.longitude}&zoom=16`;
    }

    /* Otherwise fall back to the place name in the Maps URL */
    const placeMatch = google.match(/\/maps\/place\/([^/@?]+)/);
    if (placeMatch) {
        const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
        return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(placeName)}&zoom=16`;
    }

    return null;
}

export function isInSriLanka({ latitude, longitude }: LatLng): boolean {
    return (
        latitude >= SRI_LANKA_BOUNDS.minLat &&
        latitude <= SRI_LANKA_BOUNDS.maxLat &&
        longitude >= SRI_LANKA_BOUNDS.minLng &&
        longitude <= SRI_LANKA_BOUNDS.maxLng
    );
}
