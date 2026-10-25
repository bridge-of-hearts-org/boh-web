import { describe, expect, it, vi } from "vitest";

import {
    buildMapEmbedSrc,
    buildOpenInMapsUrl,
    extractLatLng,
    hasCoordinates,
    isGoogleMapsUrl,
    isInSriLanka,
    isValidLatitude,
    isValidLongitude,
    parseLatLngFromUrl,
} from "@/utils/maps";

const PLACE_URL = "https://www.google.com/maps/place/Home/@7.2906,80.6337,17z";

describe("isGoogleMapsUrl", () => {
    it.each([
        "https://maps.app.goo.gl/abc123",
        "https://goo.gl/maps/abc123",
        "https://www.google.com/maps/place/Home/@7.29,80.63,17z",
        "https://google.com/maps",
        "https://maps.google.com/?q=7.29,80.63",
        "https://www.google.lk/maps/place/Home",
        "https://www.google.co.uk/maps/place/Home",
        "https://www.google.com.au/maps/place/Home",
        "  https://maps.app.goo.gl/abc123  ",
    ])("accepts %s", (url) => {
        expect(isGoogleMapsUrl(url)).toBe(true);
    });

    it.each([
        "http://www.google.com/maps/place/Home",
        "http://maps.app.goo.gl/abc123",
        "https://goo.gl/abc123",
        "https://www.google.com/search?q=home",
        "https://www.google.com/mapsfoo",
        "https://google.com.evil.com/maps",
        "https://evilgoogle.com/maps",
        "https://maps.google.evil.com/maps",
        "https://example.com/maps/place/Home",
        "not a url",
        "",
    ])("rejects %s", (url) => {
        expect(isGoogleMapsUrl(url)).toBe(false);
    });
});

describe("parseLatLngFromUrl", () => {
    it("parses the !3d!4d place pin", () => {
        const url =
            "https://www.google.com/maps/place/Home/data=!4m6!3m5!1s0x0:0x0!8m2!3d7.2906!4d80.6337";

        expect(parseLatLngFromUrl(url)).toEqual({
            latitude: 7.2906,
            longitude: 80.6337,
        });
    });

    it("prefers the place pin over the @ view centre", () => {
        const url =
            "https://www.google.com/maps/place/Home/@7.1,80.1,17z/data=!4m6!3m5!1s0x0:0x0!8m2!3d7.2906!4d80.6337";

        expect(parseLatLngFromUrl(url)).toEqual({
            latitude: 7.2906,
            longitude: 80.6337,
        });
    });

    it("parses the @lat,lng view centre", () => {
        expect(parseLatLngFromUrl(PLACE_URL)).toEqual({
            latitude: 7.2906,
            longitude: 80.6337,
        });
    });

    it.each(["q", "query", "ll"])("parses the ?%s= parameter", (param) => {
        const url = `https://maps.google.com/maps?${param}=7.2906,80.6337`;

        expect(parseLatLngFromUrl(url)).toEqual({
            latitude: 7.2906,
            longitude: 80.6337,
        });
    });

    it("parses a query parameter that isn't the first one", () => {
        const url = "https://maps.google.com/maps?hl=en&q=7.2906,80.6337";

        expect(parseLatLngFromUrl(url)).toEqual({
            latitude: 7.2906,
            longitude: 80.6337,
        });
    });

    it.each([
        "https://maps.google.com/maps?q=7.2906,+80.6337",
        "https://maps.google.com/maps?q=7.2906%2C80.6337",
        "https://maps.google.com/maps?q=7.2906%2C%2080.6337",
    ])("parses URL-encoded coordinates in %s", (url) => {
        expect(parseLatLngFromUrl(url)).toEqual({
            latitude: 7.2906,
            longitude: 80.6337,
        });
    });

    it("parses a /maps/search/ coordinate", () => {
        const url = "https://www.google.com/maps/search/7.2906,+80.6337";

        expect(parseLatLngFromUrl(url)).toEqual({
            latitude: 7.2906,
            longitude: 80.6337,
        });
    });

    it("parses negative coordinates", () => {
        const url =
            "https://www.google.com/maps/place/Sydney/@-33.8688,-151.2093,12z";

        expect(parseLatLngFromUrl(url)).toEqual({
            latitude: -33.8688,
            longitude: -151.2093,
        });
    });

    it("parses integer coordinates", () => {
        expect(
            parseLatLngFromUrl("https://www.google.com/maps/@7,80,10z"),
        ).toEqual({
            latitude: 7,
            longitude: 80,
        });
    });

    it("falls back to the raw URL when it has a malformed escape sequence", () => {
        const url =
            "https://www.google.com/maps/place/100%/@7.2906,80.6337,17z";

        expect(parseLatLngFromUrl(url)).toEqual({
            latitude: 7.2906,
            longitude: 80.6337,
        });
    });

    it("unwraps a consent page URL", () => {
        const url = `https://consent.google.com/ml?continue=${encodeURIComponent(PLACE_URL)}`;

        expect(parseLatLngFromUrl(url)).toEqual({
            latitude: 7.2906,
            longitude: 80.6337,
        });
    });

    it("skips an out-of-range match and tries the next pattern", () => {
        const url = "https://www.google.com/maps/@95.0,80.0,10z?q=7.1,80.2";

        expect(parseLatLngFromUrl(url)).toEqual({
            latitude: 7.1,
            longitude: 80.2,
        });
    });

    it.each([
        "https://www.google.com/maps/@95.0,80.0,10z",
        "https://www.google.com/maps/@7.0,181.0,10z",
        "https://www.google.com/maps/place/Kandy",
        "https://maps.app.goo.gl/abc123",
        "",
    ])("returns null for %s", (url) => {
        expect(parseLatLngFromUrl(url)).toBeNull();
    });
});

describe("extractLatLng", () => {
    const SHORTLINK = "https://maps.app.goo.gl/abc123";

    function redirect(location: string) {
        return new Response(null, { status: 302, headers: { location } });
    }

    function stubFetch(...responses: (Response | Error)[]) {
        const fetchMock = vi.fn();
        for (const response of responses) {
            if (response instanceof Error) {
                fetchMock.mockRejectedValueOnce(response);
            } else {
                fetchMock.mockResolvedValueOnce(response);
            }
        }
        vi.stubGlobal("fetch", fetchMock);

        return fetchMock;
    }

    it("parses a full Maps URL without fetching it", async () => {
        const fetchMock = stubFetch();

        expect(await extractLatLng(PLACE_URL)).toEqual({
            latitude: 7.2906,
            longitude: 80.6337,
            resolvedUrl: PLACE_URL,
        });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("expands a shortlink one redirect at a time", async () => {
        const fetchMock = stubFetch(redirect(PLACE_URL));

        expect(await extractLatLng(SHORTLINK)).toEqual({
            latitude: 7.2906,
            longitude: 80.6337,
            resolvedUrl: PLACE_URL,
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
            SHORTLINK,
            expect.objectContaining({ redirect: "manual" }),
        );
    });

    it("resolves a relative Location header against the current URL", async () => {
        const fetchMock = stubFetch(redirect("/def456"), redirect(PLACE_URL));

        expect(await extractLatLng(SHORTLINK)).toMatchObject({
            latitude: 7.2906,
            longitude: 80.6337,
        });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock.mock.calls[1][0]).toBe(
            "https://maps.app.goo.gl/def456",
        );
    });

    it("never fetches a redirect target that isn't a shortlink", async () => {
        const fetchMock = stubFetch(
            redirect("https://example.com/maps/@7.2906,80.6337,17z"),
        );

        const result = await extractLatLng(SHORTLINK);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        /* The coordinates are still read, but a non-Maps URL is never stored */
        expect(result).toEqual({
            latitude: 7.2906,
            longitude: 80.6337,
            resolvedUrl: SHORTLINK,
        });
    });

    it("unwraps a consent page redirect", async () => {
        const consentUrl = `https://consent.google.com/ml?continue=${encodeURIComponent(PLACE_URL)}`;
        const fetchMock = stubFetch(redirect(consentUrl));

        expect(await extractLatLng(SHORTLINK)).toEqual({
            latitude: 7.2906,
            longitude: 80.6337,
            resolvedUrl: PLACE_URL,
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("gives up after 5 redirects", async () => {
        const fetchMock = vi
            .fn()
            .mockImplementation(async () => redirect(SHORTLINK));
        vi.stubGlobal("fetch", fetchMock);

        expect(await extractLatLng(SHORTLINK)).toBeNull();
        expect(fetchMock).toHaveBeenCalledTimes(5);
    });

    it("returns null when a shortlink response has no Location header", async () => {
        stubFetch(new Response("ok", { status: 200 }));

        expect(await extractLatLng(SHORTLINK)).toBeNull();
    });

    it("returns null when the fetch fails", async () => {
        stubFetch(new Error("network down"));

        expect(await extractLatLng(SHORTLINK)).toBeNull();
    });

    it("returns null when the resolved URL has no coordinates", async () => {
        stubFetch(redirect("https://www.google.com/maps/place/Kandy"));

        expect(await extractLatLng(SHORTLINK)).toBeNull();
    });
});

describe("isValidLatitude", () => {
    it.each([0, 7.29, 90, -90])("accepts %s", (value) => {
        expect(isValidLatitude(value)).toBe(true);
    });

    it.each([90.0001, -90.0001, NaN, Infinity, -Infinity])(
        "rejects %s",
        (value) => {
            expect(isValidLatitude(value)).toBe(false);
        },
    );
});

describe("isValidLongitude", () => {
    it.each([0, 80.63, 180, -180])("accepts %s", (value) => {
        expect(isValidLongitude(value)).toBe(true);
    });

    it.each([180.0001, -180.0001, NaN, Infinity, -Infinity])(
        "rejects %s",
        (value) => {
            expect(isValidLongitude(value)).toBe(false);
        },
    );
});

describe("hasCoordinates", () => {
    it("is true for real coordinates", () => {
        expect(hasCoordinates({ latitude: 7.29, longitude: 80.63 })).toBe(true);
    });

    it("is true when only one coordinate is 0", () => {
        expect(hasCoordinates({ latitude: 0, longitude: 80.63 })).toBe(true);
        expect(hasCoordinates({ latitude: 7.29, longitude: 0 })).toBe(true);
    });

    it("is false for the legacy 0, 0 placeholder", () => {
        expect(hasCoordinates({ latitude: 0, longitude: 0 })).toBe(false);
    });

    it("is false when either coordinate is null", () => {
        expect(hasCoordinates({ latitude: null, longitude: 80.63 })).toBe(
            false,
        );
        expect(hasCoordinates({ latitude: 7.29, longitude: null })).toBe(false);
        expect(hasCoordinates({ latitude: null, longitude: null })).toBe(false);
    });
});

describe("buildOpenInMapsUrl", () => {
    it("prefers the stored Maps URL, trimmed", () => {
        expect(
            buildOpenInMapsUrl({
                google: `  ${PLACE_URL}  `,
                latitude: 7.1,
                longitude: 80.1,
            }),
        ).toBe(PLACE_URL);
    });

    it("falls back to a coordinate search when the stored URL isn't a Maps URL", () => {
        expect(
            buildOpenInMapsUrl({
                google: "https://example.com/home",
                latitude: 7.2906,
                longitude: 80.6337,
            }),
        ).toBe(
            "https://www.google.com/maps/search/?api=1&query=7.2906,80.6337",
        );
    });

    it("returns null with no Maps URL and no coordinates", () => {
        expect(
            buildOpenInMapsUrl({ google: "", latitude: null, longitude: null }),
        ).toBeNull();
        expect(
            buildOpenInMapsUrl({ google: "", latitude: 0, longitude: 0 }),
        ).toBeNull();
    });
});

describe("buildMapEmbedSrc", () => {
    it("returns null without the embed API key", () => {
        vi.stubEnv("GOOGLE_MAPS_EMBED_API_KEY", "");

        expect(
            buildMapEmbedSrc({
                google: PLACE_URL,
                latitude: 7.29,
                longitude: 80.63,
            }),
        ).toBeNull();
    });

    it("prefers the stored coordinates over the place name", () => {
        vi.stubEnv("GOOGLE_MAPS_EMBED_API_KEY", "KEY");

        expect(
            buildMapEmbedSrc({
                google: PLACE_URL,
                latitude: 7.1,
                longitude: 80.1,
            }),
        ).toBe(
            "https://www.google.com/maps/embed/v1/place?key=KEY&q=7.1,80.1&zoom=16",
        );
    });

    it("falls back to the decoded place name from the Maps URL", () => {
        vi.stubEnv("GOOGLE_MAPS_EMBED_API_KEY", "KEY");

        expect(
            buildMapEmbedSrc({
                google: "https://www.google.com/maps/place/Sacred+Heart%20Home/@7.29,80.63,17z",
                latitude: null,
                longitude: null,
            }),
        ).toBe(
            "https://www.google.com/maps/embed/v1/place?key=KEY&q=Sacred%20Heart%20Home&zoom=16",
        );
    });

    it("returns null with no coordinates and no place in the Maps URL", () => {
        vi.stubEnv("GOOGLE_MAPS_EMBED_API_KEY", "KEY");

        expect(
            buildMapEmbedSrc({
                google: "https://maps.app.goo.gl/abc123",
                latitude: 0,
                longitude: 0,
            }),
        ).toBeNull();
    });
});

describe("isInSriLanka", () => {
    it.each([
        ["Colombo", 6.9271, 79.8612],
        ["Jaffna", 9.6615, 80.0255],
        ["Kandy", 7.2906, 80.6337],
        ["the south-west corner", 5.9, 79.5],
        ["the north-east corner", 9.9, 81.9],
    ])("is true for %s", (_, latitude, longitude) => {
        expect(isInSriLanka({ latitude, longitude })).toBe(true);
    });

    it.each([
        ["Chennai", 13.0827, 80.2707],
        ["just south of the box", 5.89, 80.5],
        ["just east of the box", 7.5, 81.91],
        ["0, 0", 0, 0],
    ])("is false for %s", (_, latitude, longitude) => {
        expect(isInSriLanka({ latitude, longitude })).toBe(false);
    });
});
