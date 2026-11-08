import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { Prisma } from "@prisma/client";
import {
    BlobNotFoundError,
    BlobRequestAbortedError,
    del,
    head,
} from "@vercel/blob";

import {
    addFacility,
    createPhotoUploadToken,
    deleteUnusedPhotos,
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

/* The error classes stay real, so the actions can tell them apart */
vi.mock("@vercel/blob", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@vercel/blob")>()),
    del: vi.fn(),
    head: vi.fn(),
}));

const UNAUTHORIZED = "Unauthorized: admin login required";

/* A search filter matches the English value or the Sinhala translation */
function anyLanguage(
    field: string,
    english: Record<string, unknown>,
    search: string,
) {
    return {
        OR: [
            english,
            {
                translations: {
                    is: {
                        si: {
                            is: {
                                [field]: {
                                    contains: search,
                                    mode: "insensitive",
                                },
                            },
                        },
                    },
                },
            },
        ],
    };
}

const sinhalaTranslations = {
    si: {
        name: "සිංහල නම",
        description: null,
        address: "සිංහල ලිපිනය",
        city: "මහනුවර",
        managedBy: "",
    },
};
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
            anyLanguage(
                "name",
                { name: { contains: "Sacred", mode: "insensitive" } },
                "Sacred",
            ),
        ],
        [
            "city",
            "මහනුවර",
            anyLanguage(
                "city",
                {
                    location: {
                        is: {
                            city: { contains: "මහනුවර", mode: "insensitive" },
                        },
                    },
                },
                "මහනුවර",
            ),
        ],
        [
            "managedBy",
            "Sisters",
            anyLanguage(
                "managedBy",
                { managedBy: { contains: "Sisters", mode: "insensitive" } },
                "Sisters",
            ),
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

    // Regression test for #60: "Western" must not also match "North Western".
    it("filters province with an exact match", async () => {
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
                anyLanguage(
                    "name",
                    { name: { contains: "Home", mode: "insensitive" } },
                    "Home",
                ),
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

    // Regression test for #61: an invalid page used to give Prisma a negative or NaN skip.
    it.each([0, -1, NaN])("treats page %s as the first page", async (page) => {
        await fetchAllFacilities(emptyFilter, "name", page, 10);

        expect(findManyArgs().skip).toBe(0);
    });

    // Regression test for #61: an invalid itemsPerPage used to be passed to Prisma as is.
    it.each([0, -5, NaN])(
        "uses the default page size for itemsPerPage %s",
        async (itemsPerPage) => {
            await fetchAllFacilities(emptyFilter, "name", 1, itemsPerPage);

            expect(findManyArgs().take).toBe(10);
        },
    );

    it("caps itemsPerPage at the maximum page size", async () => {
        await fetchAllFacilities(emptyFilter, "name", 1, 5000);

        expect(findManyArgs().take).toBe(1000);
    });

    it("rounds a fractional page and itemsPerPage down", async () => {
        await fetchAllFacilities(emptyFilter, "name", 2.7, 10.5);

        expect(findManyArgs()).toMatchObject({ take: 10, skip: 10 });
    });

    it("returns Sinhala text where translated, English elsewhere", async () => {
        const facility = {
            ...emptyChildCareFacilityDbObject,
            name: "Home",
            managedBy: "Sisters",
            description: "About",
            location: {
                ...emptyChildCareFacilityDbObject.location,
                address: "1 Main St",
                city: "Kandy",
            },
            translations: sinhalaTranslations,
        };
        facilityDb.findMany.mockResolvedValue([facility]);

        const [[result]] = await fetchAllFacilities(
            emptyFilter,
            "name",
            1,
            10,
            "si",
        );

        expect(result).toMatchObject({
            name: "සිංහල නම",
            managedBy: "Sisters",
            description: "About",
            location: { address: "සිංහල ලිපිනය", city: "මහනුවර" },
        });
    });

    it.each([undefined, "en", "fr"])(
        "returns the facilities as stored for locale %s",
        async (locale) => {
            const facility = {
                ...emptyChildCareFacilityDbObject,
                name: "Home",
                translations: sinhalaTranslations,
            };
            facilityDb.findMany.mockResolvedValue([facility]);

            const [[result]] = await fetchAllFacilities(
                emptyFilter,
                "name",
                1,
                10,
                locale,
            );

            expect(result).toEqual(facility);
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
            AND: [
                anyLanguage(
                    "name",
                    { name: { contains: "Home", mode: "insensitive" } },
                    "Home",
                ),
            ],
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

    it("names Sinhala pins in Sinhala where translated", async () => {
        facilityDb.findMany.mockResolvedValue([
            { ...pinRow("a", 7.29, 80.63), translations: sinhalaTranslations },
            pinRow("b", 6.93, 79.86),
        ] as never);

        const pins = await fetchFacilityPins(emptyFilter, "si");

        expect(pins.map((p) => [p.name, p.city])).toEqual([
            ["සිංහල නම", "මහනුවර"],
            ["b", "Kandy"],
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

    it("lists Sinhala city names where translated", async () => {
        facilityDb.findMany.mockResolvedValue([
            { location: { city: "Kandy" }, translations: sinhalaTranslations },
            { location: { city: "Colombo" }, translations: null },
        ] as never);

        expect(await fetchDistinctCities("si")).toEqual(["Colombo", "මහනුවර"]);
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

    it("lists Sinhala names where translated", async () => {
        facilityDb.findMany.mockResolvedValue([
            { name: "Home", translations: sinhalaTranslations },
            { name: "Other", translations: null },
        ] as never);

        expect(await fetchFacilityNames("si")).toEqual(["Other", "සිංහල නම"]);
        expect(await fetchFacilityNames()).toEqual(["Home", "Other"]);
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

    it("lists Sinhala values where translated, English otherwise", async () => {
        facilityDb.findMany.mockResolvedValue([
            {
                managedBy: "Sisters",
                translations: { si: { managedBy: " සහෝදරියන් " } },
            },
            /* An empty translation falls back to English */
            { managedBy: "Probation", translations: sinhalaTranslations },
        ] as never);

        expect(await fetchDistinctManagedBy("si")).toEqual([
            "Probation",
            "සහෝදරියන්",
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

    it("returns the stored facility, translations included, without a locale", async () => {
        const facility = {
            ...emptyChildCareFacilityDbObject,
            name: "Home",
            translations: sinhalaTranslations,
        };
        facilityDb.findUnique.mockResolvedValue(facility);

        expect(await fetchFacilityBySlug("home")).toEqual(facility);
    });

    it("returns Sinhala text for the Sinhala page", async () => {
        facilityDb.findUnique.mockResolvedValue({
            ...emptyChildCareFacilityDbObject,
            name: "Home",
            translations: sinhalaTranslations,
        });

        expect(await fetchFacilityBySlug("home", "si")).toMatchObject({
            name: "සිංහල නම",
            translations: sinhalaTranslations,
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

    it("drops verifications for values the facility no longer lists", async () => {
        loginAsAdmin();
        const verifiedAt = new Date("2026-03-12T00:00:00Z");
        const withVerification = {
            ...input,
            contact: { ...input.contact, phone: ["0771234567"] },
            verification: {
                phones: [
                    { value: "0771234567", verifiedAt: verifiedAt },
                    { value: "0812345678", verifiedAt: verifiedAt },
                ],
                emails: [{ value: "old@example.com", verifiedAt: verifiedAt }],
                occupancy: null,
                ageRanges: null,
            },
        };

        expect(await action(withVerification)).toBe("success");
        expect(facilityDb[query].mock.calls[0][0].data.verification).toEqual({
            phones: [{ value: "0771234567", verifiedAt: verifiedAt }],
            emails: [],
            occupancy: null,
            ageRanges: null,
        });
    });

    it("saves trimmed Sinhala values and leaves empty ones out", async () => {
        loginAsAdmin();

        expect(
            await action({
                ...input,
                translations: {
                    si: {
                        name: " සිංහල නම ",
                        description: "",
                        address: null,
                        city: "මහනුවර",
                        managedBy: "  ",
                    },
                },
            }),
        ).toBe("success");
        expect(facilityDb[query].mock.calls[0][0].data.translations).toEqual({
            si: {
                name: "සිංහල නම",
                description: null,
                address: null,
                city: "මහනුවර",
                managedBy: null,
            },
        });
    });

    it("clears the translations when every Sinhala value is empty", async () => {
        loginAsAdmin();

        await action({
            ...input,
            translations: {
                si: {
                    name: "",
                    description: "",
                    address: "",
                    city: " ",
                    managedBy: "",
                },
            },
        });

        expect(facilityDb[query].mock.calls[0][0].data.translations).toBeNull();
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
    const STORAGE = "https://hzhlx0obnpowbirz.public.blob.vercel-storage.com";
    const FILE_NAME = "0123456789abcdef.png";
    const generateToken = vi.mocked(generateClientTokenFromReadWriteToken);
    const headBlob = vi.mocked(head);

    beforeEach(() => {
        vi.stubEnv("BLOB_READ_WRITE_TOKEN", "blob-token");
        /* Production's photo folder */
        vi.stubEnv("NEXT_PUBLIC_PHOTO_FOLDER", "");
        generateToken.mockResolvedValue("client-token");
        headBlob.mockRejectedValue(new BlobNotFoundError());
    });

    it("refuses without an admin session", async () => {
        expect(await createPhotoUploadToken("home", FILE_NAME)).toEqual({
            error: UNAUTHORIZED,
        });
        expect(generateToken).not.toHaveBeenCalled();
        expect(headBlob).not.toHaveBeenCalled();
    });

    it("reports a photo that's already stored instead of issuing a token", async () => {
        loginAsAdmin();
        headBlob.mockResolvedValue({} as any);

        expect(await createPhotoUploadToken("home", FILE_NAME)).toEqual({
            exists: true,
        });
        expect(headBlob).toHaveBeenCalledWith(`${STORAGE}/home/${FILE_NAME}`, {
            token: "blob-token",
            abortSignal: expect.any(AbortSignal),
        });
        expect(generateToken).not.toHaveBeenCalled();
    });

    it("gives up on the stored-photo check after 5 seconds", async () => {
        loginAsAdmin();
        vi.useFakeTimers();
        /* Like the SDK: the check only ends once its signal aborts */
        headBlob.mockImplementation(
            (_url, options) =>
                new Promise((_resolve, reject) => {
                    options?.abortSignal?.addEventListener("abort", () =>
                        reject(new BlobRequestAbortedError()),
                    );
                }),
        );

        try {
            const result = createPhotoUploadToken("home", FILE_NAME);
            await vi.advanceTimersByTimeAsync(5000);

            expect(await result).toEqual({ token: "client-token" });
        } finally {
            vi.useRealTimers();
        }
    });

    it("still issues a token when it can't check for a stored photo", async () => {
        loginAsAdmin();
        headBlob.mockRejectedValue(new Error("Blob API down"));

        expect(await createPhotoUploadToken("home", FILE_NAME)).toEqual({
            token: "client-token",
        });
    });

    it("keeps photos in the dev folder outside production", async () => {
        loginAsAdmin();
        vi.stubEnv("NEXT_PUBLIC_PHOTO_FOLDER", "dev");

        await createPhotoUploadToken("home", FILE_NAME);

        expect(headBlob).toHaveBeenCalledWith(
            `${STORAGE}/dev/home/${FILE_NAME}`,
            { token: "blob-token", abortSignal: expect.any(AbortSignal) },
        );
        expect(generateToken).toHaveBeenCalledWith(
            expect.objectContaining({ pathname: `dev/home/${FILE_NAME}` }),
        );
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

describe("deleteUnusedPhotos", () => {
    const STORAGE = "https://hzhlx0obnpowbirz.public.blob.vercel-storage.com";
    const USED = "aaaaaaaaaaaaaaaa.jpg";
    const UNUSED = "bbbbbbbbbbbbbbbb.png";
    const deleteBlobs = vi.mocked(del);

    function savedPhotos(...fileNames: string[]) {
        facilityDb.findUnique.mockResolvedValue({
            photos: fileNames.map((fileName) => ({ fileName, source: "" })),
        } as any);
    }

    beforeEach(() => {
        vi.stubEnv("BLOB_READ_WRITE_TOKEN", "blob-token");
        /* Production's photo folder */
        vi.stubEnv("NEXT_PUBLIC_PHOTO_FOLDER", "");
        deleteBlobs.mockResolvedValue(undefined);
        savedPhotos(USED);
    });

    it("deletes from the dev folder outside production", async () => {
        loginAsAdmin();
        vi.stubEnv("NEXT_PUBLIC_PHOTO_FOLDER", "dev");

        expect(await deleteUnusedPhotos("home", [UNUSED])).toEqual({
            deleted: [UNUSED],
        });
        expect(deleteBlobs).toHaveBeenCalledWith(
            [`${STORAGE}/dev/home/${UNUSED}`],
            { token: "blob-token" },
        );
    });

    it("refuses without an admin session", async () => {
        expect(await deleteUnusedPhotos("home", [UNUSED])).toEqual({
            error: UNAUTHORIZED,
        });
        expect(deleteBlobs).not.toHaveBeenCalled();
    });

    it("deletes photos the saved facility doesn't list", async () => {
        loginAsAdmin();

        expect(await deleteUnusedPhotos("home", [UNUSED])).toEqual({
            deleted: [UNUSED],
        });
        expect(facilityDb.findUnique).toHaveBeenCalledWith({
            where: { slug: "home" },
            select: { photos: true },
        });
        expect(deleteBlobs).toHaveBeenCalledWith(
            [`${STORAGE}/home/${UNUSED}`],
            {
                token: "blob-token",
            },
        );
    });

    it("never deletes a photo the saved facility still lists", async () => {
        loginAsAdmin();

        expect(await deleteUnusedPhotos("home", [USED, UNUSED])).toEqual({
            deleted: [UNUSED],
        });
        expect(deleteBlobs).toHaveBeenCalledWith(
            [`${STORAGE}/home/${UNUSED}`],
            expect.anything(),
        );
    });

    it("skips the delete when every photo is in use", async () => {
        loginAsAdmin();

        expect(await deleteUnusedPhotos("home", [USED])).toEqual({
            deleted: [],
        });
        expect(deleteBlobs).not.toHaveBeenCalled();
    });

    it("deletes photos under a slug no facility has", async () => {
        loginAsAdmin();
        facilityDb.findUnique.mockResolvedValue(null);

        expect(await deleteUnusedPhotos("new-home", [UNUSED])).toEqual({
            deleted: [UNUSED],
        });
    });

    it("deletes nothing when it can't check which photos are in use", async () => {
        loginAsAdmin();
        facilityDb.findUnique.mockRejectedValue(new Error("DB down"));

        expect(await deleteUnusedPhotos("home", [UNUSED])).toEqual({
            error: "Couldn't check which photos are in use",
        });
        expect(deleteBlobs).not.toHaveBeenCalled();
    });

    it.each(["Home", "../home", "home/photos", "", 123])(
        "rejects the slug %j",
        async (slug) => {
            loginAsAdmin();

            expect(await deleteUnusedPhotos(slug as string, [UNUSED])).toEqual({
                error: "The slug may only contain lowercase letters, numbers and hyphens",
            });
            expect(deleteBlobs).not.toHaveBeenCalled();
        },
    );

    it("deletes GIFs, which the sheet sync can store", async () => {
        loginAsAdmin();
        const gif = "cccccccccccccccc.gif";

        expect(await deleteUnusedPhotos("home", [gif])).toEqual({
            deleted: [gif],
        });
        expect(deleteBlobs).toHaveBeenCalledWith(
            [`${STORAGE}/home/${gif}`],
            expect.anything(),
        );
    });

    it("skips invalid names and deletes the rest", async () => {
        loginAsAdmin();

        expect(
            await deleteUnusedPhotos("home", [
                "../bbbbbbbbbbbbbbbb.png",
                "photo.png",
                123 as unknown as string,
                UNUSED,
            ]),
        ).toEqual({ deleted: [UNUSED] });
        expect(deleteBlobs).toHaveBeenCalledWith(
            [`${STORAGE}/home/${UNUSED}`],
            expect.anything(),
        );
    });

    it("deletes nothing when every name is invalid", async () => {
        loginAsAdmin();

        expect(await deleteUnusedPhotos("home", ["photo.png"])).toEqual({
            deleted: [],
        });
        expect(deleteBlobs).not.toHaveBeenCalled();
    });

    it.each([
        ["a non-array", "bbbbbbbbbbbbbbbb.png"],
        ["too many names", Array(51).fill(UNUSED)],
    ])("rejects %s", async (_, fileNames) => {
        loginAsAdmin();

        expect(await deleteUnusedPhotos("home", fileNames as string[])).toEqual(
            { error: "Invalid photo file names" },
        );
        expect(deleteBlobs).not.toHaveBeenCalled();
    });

    it("reports when photo storage isn't configured", async () => {
        loginAsAdmin();
        vi.stubEnv("BLOB_READ_WRITE_TOKEN", undefined);
        vi.stubEnv("VERCEL_TOKEN", undefined);

        expect(await deleteUnusedPhotos("home", [UNUSED])).toEqual({
            error: "Photo storage is not configured on this server",
        });
        expect(deleteBlobs).not.toHaveBeenCalled();
    });

    it("reports when the delete fails", async () => {
        loginAsAdmin();
        deleteBlobs.mockRejectedValue(new Error("Blob API down"));

        expect(await deleteUnusedPhotos("home", [UNUSED])).toEqual({
            error: "Couldn't delete the photos",
        });
    });
});
