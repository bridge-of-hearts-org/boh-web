import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { Prisma } from "@prisma/client";

import {
    addFacility,
    createPhotoUploadToken,
    fetchAllFacilities,
    fetchDistinctCities,
    fetchDistinctManagedBy,
    fetchFacilityBySlug,
    fetchFacilityNames,
    fetchFacilityPins,
    resolveLatLng,
    updateFacility,
} from "@/app/actions/data";
import { getServerAuth } from "@/lib/auth";
import { prisma } from "@/utils/db";
import { emptyChildCareFacilityDbObject, emptyFilter } from "@/utils/defines";
import { extractLatLng } from "@/utils/maps";
import { removeKeys } from "@/utils/utils";

vi.mock("@/utils/db", () => ({
    prisma: {
        /* The real $transaction runs the queries it's given; the mocked queries already return promises */
        $transaction: vi.fn((queries: Promise<unknown>[]) =>
            Promise.all(queries),
        ),
        childCareFacility: {
            findMany: vi.fn(),
            count: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            create: vi.fn(),
        },
    },
}));

vi.mock("@/lib/auth", () => ({
    getServerAuth: vi.fn(),
}));

/* Only the network-touching helper is mocked; URL checks use the real code */
vi.mock("@/utils/maps", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@/utils/maps")>()),
    extractLatLng: vi.fn(),
}));

vi.mock("@vercel/blob/client", () => ({
    generateClientTokenFromReadWriteToken: vi.fn(),
}));

const UNAUTHORIZED = "Unauthorized: admin login required";
const facilityDb = vi.mocked(prisma.childCareFacility);

const ADMIN_SESSION = { user: { role: "admin" }, expires: "" };

function loginAsAdmin() {
    vi.mocked(getServerAuth).mockResolvedValue(ADMIN_SESSION);
}

function logout() {
    vi.mocked(getServerAuth).mockResolvedValue(null);
}

beforeEach(() => {
    vi.clearAllMocks();
    logout();
    /* The actions log caught errors; keep the test output readable */
    vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("fetchAllFacilities", () => {
    beforeEach(() => {
        facilityDb.findMany.mockResolvedValue([]);
        facilityDb.count.mockResolvedValue(0);
    });

    function findManyArgs() {
        return facilityDb.findMany.mock.calls[0][0]!;
    }

    it("queries everything, sorted by name, when no filter is set", async () => {
        await fetchAllFacilities(emptyFilter, "name", 1, 10);

        expect(facilityDb.findMany).toHaveBeenCalledWith({
            where: { AND: [] },
            take: 10,
            skip: 0,
            orderBy: { name: "asc" },
        });
        expect(facilityDb.count).toHaveBeenCalledWith({ where: { AND: [] } });
    });

    it("returns the page of facilities and the total count", async () => {
        const facility = { ...emptyChildCareFacilityDbObject, name: "Home" };
        facilityDb.findMany.mockResolvedValue([facility]);
        facilityDb.count.mockResolvedValue(42);

        expect(await fetchAllFacilities(emptyFilter, "name", 1, 10)).toEqual([
            [facility],
            42,
        ]);
    });

    it.each([
        [
            "name",
            "Sacred",
            { name: { contains: "Sacred", mode: "insensitive" } },
        ],
        [
            "city",
            "Kandy",
            {
                location: {
                    is: { city: { contains: "Kandy", mode: "insensitive" } },
                },
            },
        ],
        [
            "managedBy",
            "Sisters",
            { managedBy: { contains: "Sisters", mode: "insensitive" } },
        ],
        [
            "district",
            "Kandy",
            {
                location: {
                    is: { district: { equals: "Kandy", mode: "insensitive" } },
                },
            },
        ],
    ])("filters by %s", async (field, value, clause) => {
        await fetchAllFacilities(
            { ...emptyFilter, [field]: value },
            "name",
            1,
            10,
        );

        expect(findManyArgs().where).toEqual({ AND: [clause] });
        expect(facilityDb.count).toHaveBeenCalledWith({
            where: { AND: [clause] },
        });
    });

    // Known bug #60: province uses `contains`, so "Western" also matches "North Western".
    // Change `it.fails` to `it` when fixing #60.
    it.fails("filters province with an exact match", async () => {
        await fetchAllFacilities(
            { ...emptyFilter, province: "Western" },
            "name",
            1,
            10,
        );

        expect(findManyArgs().where).toEqual({
            AND: [
                {
                    location: {
                        is: {
                            province: {
                                equals: "Western",
                                mode: "insensitive",
                            },
                        },
                    },
                },
            ],
        });
    });

    it("combines several filters", async () => {
        await fetchAllFacilities(
            {
                ...emptyFilter,
                name: "Home",
                district: "Kandy",
                province: "Central",
            },
            "name",
            1,
            10,
        );

        expect(findManyArgs().where?.AND).toHaveLength(3);
        expect(findManyArgs().where?.AND).toEqual(
            expect.arrayContaining([
                { name: { contains: "Home", mode: "insensitive" } },
                {
                    location: {
                        is: {
                            district: { equals: "Kandy", mode: "insensitive" },
                        },
                    },
                },
            ]),
        );
    });

    it("sorts by city", async () => {
        await fetchAllFacilities(emptyFilter, "city", 1, 10);

        expect(findManyArgs().orderBy).toEqual({ location: { city: "asc" } });
    });

    it("sorts by name for any other sort value", async () => {
        await fetchAllFacilities(emptyFilter, "unknown", 1, 10);

        expect(findManyArgs().orderBy).toEqual({ name: "asc" });
    });

    it("skips the earlier pages", async () => {
        await fetchAllFacilities(emptyFilter, "name", 3, 25);

        expect(findManyArgs()).toMatchObject({ take: 25, skip: 50 });
    });

    // Known bug #61: an invalid page gives Prisma a negative or NaN skip, so no results are shown.
    // Change `it.fails` to `it` when fixing #61.
    it.fails.each([0, -1, NaN])(
        "treats page %s as the first page",
        async (page) => {
            await fetchAllFacilities(emptyFilter, "name", page, 10);

            expect(findManyArgs().skip).toBe(0);
        },
    );

    // Known bug #61: an invalid itemsPerPage is passed to Prisma as is.
    // Change `it.fails` to `it` when fixing #61.
    it.fails.each([0, -5, NaN])(
        "uses the default page size for itemsPerPage %s",
        async (itemsPerPage) => {
            await fetchAllFacilities(emptyFilter, "name", 1, itemsPerPage);

            expect(findManyArgs().take).toBe(10);
        },
    );

    it("returns an empty result when the query fails", async () => {
        facilityDb.findMany.mockRejectedValue(new Error("connection lost"));

        expect(await fetchAllFacilities(emptyFilter, "name", 1, 10)).toEqual([
            [],
            0,
        ]);
    });
});

describe("fetchFacilityPins", () => {
    function pinRow(
        slug: string,
        latitude: number | null,
        longitude: number | null,
        google = "",
    ) {
        return {
            name: slug,
            slug,
            location: { city: "Kandy", google, latitude, longitude },
        };
    }

    it("uses the directory filter, without paging", async () => {
        facilityDb.findMany.mockResolvedValue([]);

        await fetchFacilityPins({ ...emptyFilter, name: "Home" });

        const args = facilityDb.findMany.mock.calls[0][0]!;
        expect(args.where).toEqual({
            AND: [{ name: { contains: "Home", mode: "insensitive" } }],
        });
        expect(args).not.toHaveProperty("take");
        expect(args).not.toHaveProperty("skip");
    });

    it("returns a pin for each facility with coordinates", async () => {
        const placeUrl = "https://www.google.com/maps/place/A/@7.29,80.63,17z";
        facilityDb.findMany.mockResolvedValue([
            pinRow("a", 7.29, 80.63, placeUrl),
            pinRow("b", 6.93, 79.86),
        ] as never);

        expect(await fetchFacilityPins(emptyFilter)).toEqual([
            {
                name: "a",
                slug: "a",
                city: "Kandy",
                lat: 7.29,
                lng: 80.63,
                mapsUrl: placeUrl,
            },
            {
                name: "b",
                slug: "b",
                city: "Kandy",
                lat: 6.93,
                lng: 79.86,
                mapsUrl:
                    "https://www.google.com/maps/search/?api=1&query=6.93,79.86",
            },
        ]);
    });

    it("leaves out facilities without coordinates", async () => {
        facilityDb.findMany.mockResolvedValue([
            pinRow("none", null, null, "https://www.google.com/maps/place/A"),
            pinRow("zero", 0, 0),
            pinRow("half", 7.29, null),
        ] as never);

        expect(await fetchFacilityPins(emptyFilter)).toEqual([]);
    });

    it("returns no pins when the query fails", async () => {
        facilityDb.findMany.mockRejectedValue(new Error("connection lost"));

        expect(await fetchFacilityPins(emptyFilter)).toEqual([]);
    });
});

describe("fetchDistinctCities", () => {
    it("returns each city once, sorted", async () => {
        facilityDb.findMany.mockResolvedValue([
            { location: { city: "Kandy" } },
            { location: { city: "Colombo" } },
            { location: { city: "Kandy" } },
        ] as never);

        expect(await fetchDistinctCities()).toEqual(["Colombo", "Kandy"]);
    });

    it("returns no cities when the query fails", async () => {
        facilityDb.findMany.mockRejectedValue(new Error("connection lost"));

        expect(await fetchDistinctCities()).toEqual([]);
    });
});

describe("fetchFacilityNames", () => {
    it("sorts names alphabetically, ignoring case", async () => {
        facilityDb.findMany.mockResolvedValue([
            { name: "banana" },
            { name: "Cherry" },
            { name: "apple" },
        ] as never);

        expect(await fetchFacilityNames()).toEqual([
            "apple",
            "banana",
            "Cherry",
        ]);
    });

    it("returns no names when the query fails", async () => {
        facilityDb.findMany.mockRejectedValue(new Error("connection lost"));

        expect(await fetchFacilityNames()).toEqual([]);
    });
});

describe("fetchDistinctManagedBy", () => {
    it("returns each trimmed, non-empty value once, sorted", async () => {
        facilityDb.findMany.mockResolvedValue([
            { managedBy: " Sisters of Charity " },
            { managedBy: "" },
            { managedBy: "   " },
            { managedBy: "department of probation" },
            { managedBy: "Sisters of Charity" },
        ] as never);

        expect(await fetchDistinctManagedBy()).toEqual([
            "department of probation",
            "Sisters of Charity",
        ]);
    });

    it("returns no values when the query fails", async () => {
        facilityDb.findMany.mockRejectedValue(new Error("connection lost"));

        expect(await fetchDistinctManagedBy()).toEqual([]);
    });
});

describe("fetchFacilityBySlug", () => {
    it("looks the facility up by slug", async () => {
        const facility = { ...emptyChildCareFacilityDbObject, slug: "home" };
        facilityDb.findUnique.mockResolvedValue(facility);

        expect(await fetchFacilityBySlug("home")).toBe(facility);
        expect(facilityDb.findUnique).toHaveBeenCalledWith({
            where: { slug: "home" },
        });
    });

    it("returns null when there's no such facility", async () => {
        facilityDb.findUnique.mockResolvedValue(null);

        expect(await fetchFacilityBySlug("missing")).toBeNull();
    });

    it("returns null when the query fails", async () => {
        facilityDb.findUnique.mockRejectedValue(new Error("connection lost"));

        expect(await fetchFacilityBySlug("home")).toBeNull();
    });
});

describe.each([
    { action: updateFacility, query: "update" as const },
    { action: addFacility, query: "create" as const },
])("$action.name", ({ action, query }) => {
    const input = removeKeys(
        { ...emptyChildCareFacilityDbObject, slug: "home", name: "Home" },
        ["id", "createdAt", "updatedAt"],
    );

    it("refuses to write without an admin session", async () => {
        expect(await action(input)).toBe(UNAUTHORIZED);
        expect(facilityDb[query]).not.toHaveBeenCalled();
    });

    it("writes the facility for an admin", async () => {
        loginAsAdmin();

        expect(await action(input)).toBe("success");
        expect(facilityDb[query]).toHaveBeenCalledWith(
            query === "update"
                ? { where: { slug: "home" }, data: input }
                : { data: input },
        );
    });

    it("returns the error message when the write fails", async () => {
        loginAsAdmin();
        facilityDb[query].mockRejectedValue(
            new Error("Unique constraint failed"),
        );

        expect(await action(input)).toBe("Unique constraint failed");
    });

    it("explains a duplicate slug instead of returning the raw Prisma error", async () => {
        loginAsAdmin();
        facilityDb[query].mockRejectedValue(
            new Prisma.PrismaClientKnownRequestError(
                "Unique constraint failed on the constraint: `ChildCareFacility_slug_key`",
                {
                    code: "P2002",
                    clientVersion: "test",
                    meta: { target: "ChildCareFacility_slug_key" },
                },
            ),
        );

        expect(await action(input)).toBe(
            "A facility with this slug already exists",
        );
    });

    it("describes errors that aren't Error objects", async () => {
        loginAsAdmin();
        facilityDb[query].mockRejectedValue("boom");

        expect(await action(input)).toBe("Unknown Error: boom");
    });
});

describe("resolveLatLng", () => {
    const SHORTLINK = "https://maps.app.goo.gl/abc123";

    it("refuses without an admin session, before fetching anything", async () => {
        expect(await resolveLatLng(SHORTLINK)).toEqual({ error: UNAUTHORIZED });
        expect(extractLatLng).not.toHaveBeenCalled();
    });

    it.each([
        "https://example.com/maps/abc",
        "http://maps.app.goo.gl/abc123",
        "",
        123,
    ])("refuses to fetch %j, which isn't a Google Maps URL", async (url) => {
        loginAsAdmin();

        expect(await resolveLatLng(url as string)).toEqual({
            error: "Not a Google Maps URL",
        });
        expect(extractLatLng).not.toHaveBeenCalled();
    });

    it("returns the coordinates for a trimmed Maps URL", async () => {
        loginAsAdmin();
        const coords = {
            latitude: 7.29,
            longitude: 80.63,
            resolvedUrl: "https://www.google.com/maps/place/A/@7.29,80.63,17z",
        };
        vi.mocked(extractLatLng).mockResolvedValue(coords);

        expect(await resolveLatLng(`  ${SHORTLINK} `)).toEqual(coords);
        expect(extractLatLng).toHaveBeenCalledWith(SHORTLINK);
    });

    it("asks for manual entry when no coordinates are found", async () => {
        loginAsAdmin();
        vi.mocked(extractLatLng).mockResolvedValue(null);

        expect(await resolveLatLng(SHORTLINK)).toEqual({
            error: "Couldn't find coordinates in this URL. Enter them manually.",
        });
    });
});

describe("createPhotoUploadToken", () => {
    const FILE_NAME = "0123456789abcdef.png";
    const generateToken = vi.mocked(generateClientTokenFromReadWriteToken);

    beforeEach(() => {
        vi.stubEnv("BLOB_READ_WRITE_TOKEN", "blob-token");
        generateToken.mockResolvedValue("client-token");
    });

    it("refuses without an admin session", async () => {
        expect(await createPhotoUploadToken("home", FILE_NAME)).toEqual({
            error: UNAUTHORIZED,
        });
        expect(generateToken).not.toHaveBeenCalled();
    });

    it.each(["Home", "../home", "home/photos", "", 123])(
        "rejects the slug %j",
        async (slug) => {
            loginAsAdmin();

            expect(
                await createPhotoUploadToken(slug as string, FILE_NAME),
            ).toEqual({
                error: "The slug may only contain lowercase letters, numbers and hyphens",
            });
            expect(generateToken).not.toHaveBeenCalled();
        },
    );

    it.each([
        "photo.png",
        "0123456789abcdef.gif",
        "../0123456789abcdef.png",
        123,
    ])("rejects the file name %j", async (fileName) => {
        loginAsAdmin();

        expect(
            await createPhotoUploadToken("home", fileName as string),
        ).toEqual({
            error: "Invalid photo file name",
        });
        expect(generateToken).not.toHaveBeenCalled();
    });

    it("issues a token limited to the photo's path, type and size", async () => {
        loginAsAdmin();
        vi.useFakeTimers({ now: 1_000_000 });

        try {
            expect(await createPhotoUploadToken("home", FILE_NAME)).toEqual({
                token: "client-token",
            });
        } finally {
            vi.useRealTimers();
        }

        expect(generateToken).toHaveBeenCalledWith({
            token: "blob-token",
            pathname: "home/0123456789abcdef.png",
            allowedContentTypes: ["image/png"],
            maximumSizeInBytes: 10 * 1024 * 1024,
            addRandomSuffix: false,
            validUntil: 1_000_000 + 5 * 60 * 1000,
        });
    });

    it("falls back to the sync script's VERCEL_TOKEN", async () => {
        loginAsAdmin();
        vi.stubEnv("BLOB_READ_WRITE_TOKEN", undefined);
        vi.stubEnv("VERCEL_TOKEN", "vercel-token");

        await createPhotoUploadToken("home", FILE_NAME);

        expect(generateToken).toHaveBeenCalledWith(
            expect.objectContaining({ token: "vercel-token" }),
        );
    });

    it("reports when photo storage isn't configured", async () => {
        loginAsAdmin();
        vi.stubEnv("BLOB_READ_WRITE_TOKEN", undefined);
        vi.stubEnv("VERCEL_TOKEN", undefined);

        expect(await createPhotoUploadToken("home", FILE_NAME)).toEqual({
            error: "Photo storage is not configured on this server",
        });
        expect(generateToken).not.toHaveBeenCalled();
    });

    it("reports when the token can't be created", async () => {
        loginAsAdmin();
        generateToken.mockRejectedValue(new Error("Blob API down"));

        expect(await createPhotoUploadToken("home", FILE_NAME)).toEqual({
            error: "Couldn't start the upload",
        });
    });
});
