import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    detectImageType,
    fileTypeFromUrl,
    parseRow,
} from "../../../scripts/syncHelpers";
import { extractLatLng } from "@/utils/maps";

vi.mock("@/utils/maps", () => ({
    extractLatLng: vi.fn(),
}));

describe("detectImageType", () => {
    it.each([
        ["jpg", [0xff, 0xd8, 0xff, 0xe0]],
        ["png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]],
        ["webp", [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]],
        ["gif", [0x47, 0x49, 0x46, 0x38]],
    ])("detects %s from its magic bytes", (type, bytes) => {
        expect(detectImageType(Buffer.from(bytes))).toBe(type);
    });

    it("doesn't treat a non-WebP RIFF file (e.g. WAV) as WebP", () => {
        const wav = Buffer.from([
            0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45,
        ]);

        expect(detectImageType(wav)).toBeNull();
    });

    it("returns null for unknown or too-short data", () => {
        expect(detectImageType(Buffer.from("<html>"))).toBeNull();
        expect(detectImageType(Buffer.from([0xff, 0xd8]))).toBeNull();
        expect(detectImageType(Buffer.alloc(0))).toBeNull();
    });
});

describe("fileTypeFromUrl", () => {
    it.each([
        ["https://example.com/a.jpg", "jpg"],
        ["https://example.com/a.jpeg", "jpg"],
        ["https://example.com/a.PNG", "png"],
        ["https://example.com/a.webp?size=large", "webp"],
        ["https://example.com/a.gif", "gif"],
    ])("reads the type of %s", (url, type) => {
        expect(fileTypeFromUrl(url)).toBe(type);
    });

    it.each([
        "https://example.com/a.bmp",
        "https://example.com/photo?id=1.jpg",
    ])("returns null for %s", (url) => {
        expect(fileTypeFromUrl(url)).toBeNull();
    });
});

describe("parseRow", () => {
    const row = {
        Name: " Sacred Heart Home ",
        Slug: " sacred-heart-home ",
        Type: "",
        "Managed By": " Sisters of Charity ",
        Description: " A home ",
        Address: " 1 Main St ",
        City: " Kandy ",
        District: " Kandy ",
        Province: " Central ",
        "Divisional Secretariat": " Kandy Four Gravets ",
        "Google Maps": "",
        "Accepted Genders": "Female",
        "Phone Numbers": "0812345678, 0771234567",
        "Email Addresses": "home@example.com, info@example.com",
        Website: "https://example.com/ ",
        Facebook: "https://facebook.com/home//",
        Instagram: "",
        "Count - Total": "30",
        "Count - Male": "",
        "Count - Female": "30",
        "Age Range - All": " 5-18 ",
        "Age Range - Male": "",
        "Age Range - Female": "5-18",
        Photos: "https://example.com/1.jpg | https://example.com/2.jpg |",
        Sources: "Sheet A|Sheet B",
    };

    beforeEach(() => {
        vi.mocked(extractLatLng).mockReset();
    });

    it("skips rows without a slug", async () => {
        expect(await parseRow({ ...row, Slug: "" })).toBeNull();
        expect(await parseRow({ ...row, Slug: "   " })).toBeNull();
    });

    it("converts a full row", async () => {
        expect(await parseRow(row)).toEqual({
            name: "Sacred Heart Home",
            slug: "sacred-heart-home",
            type: "Voluntary Children's Home",
            managedBy: "Sisters of Charity",
            description: "A home",
            location: {
                address: "1 Main St",
                city: "Kandy",
                district: "Kandy",
                province: "Central",
                divisionalSecretariat: "Kandy Four Gravets",
                google: "",
                latitude: null,
                longitude: null,
            },
            contact: {
                phone: ["0812345678", "0771234567"],
                email: ["home@example.com", "info@example.com"],
                website: "https://example.com",
                facebook: "https://facebook.com/home",
                instagram: "",
            },
            genders: "female",
            occupancy: { total: 30, male: null, female: 30 },
            ageRanges: { all: "5-18", male: "", female: "5-18" },
            photoUrls: [
                "https://example.com/1.jpg",
                "https://example.com/2.jpg",
            ],
            sources: ["Sheet A", "Sheet B"],
        });
        expect(extractLatLng).not.toHaveBeenCalled();
    });

    it("defaults optional columns that are missing from the sheet", async () => {
        const result = await parseRow({ Name: "Home", Slug: "home" });

        expect(result).toMatchObject({
            type: "Voluntary Children's Home",
            managedBy: "",
            genders: "unknown",
            occupancy: { total: null, male: null, female: null },
            contact: { phone: [], email: [], website: "" },
            photoUrls: [],
            sources: [],
        });
    });

    it("keeps an explicit facility type", async () => {
        expect(
            await parseRow({ ...row, Type: " State Children's Home " }),
        ).toMatchObject({
            type: "State Children's Home",
        });
    });

    it.each([
        ["Male", "male"],
        ["Both", "both"],
        ["", "unknown"],
    ])("maps the gender %j to %j", async (gender, expected) => {
        expect(
            await parseRow({ ...row, "Accepted Genders": gender }),
        ).toMatchObject({
            genders: expected,
        });
    });

    it("rejects an unknown gender", async () => {
        await expect(
            parseRow({ ...row, "Accepted Genders": "male" }),
        ).rejects.toThrow('Invalid gender: "male"');
    });

    it.each(["771234567", "+94771234567", "08123456789"])(
        "rejects the phone number %j",
        async (phone) => {
            await expect(
                parseRow({ ...row, "Phone Numbers": phone }),
            ).rejects.toThrow(`Invalid phone: "${phone}"`);
        },
    );

    it("rejects an email address without @", async () => {
        await expect(
            parseRow({
                ...row,
                "Email Addresses": "home@example.com, info.example.com",
            }),
        ).rejects.toThrow('Invalid email: "info.example.com"');
    });

    it("ignores empty entries in comma-separated lists", async () => {
        expect(
            await parseRow({
                ...row,
                "Phone Numbers": "0812345678,, ",
                "Email Addresses": ",",
            }),
        ).toMatchObject({ contact: { phone: ["0812345678"], email: [] } });
    });

    it("stores the resolved Maps URL and coordinates", async () => {
        vi.mocked(extractLatLng).mockResolvedValue({
            latitude: 7.2906,
            longitude: 80.6337,
            resolvedUrl:
                "https://www.google.com/maps/place/Home/@7.2906,80.6337,17z",
        });

        const result = await parseRow({
            ...row,
            "Google Maps": " /https://maps.app.goo.gl/abc/ ",
        });

        /* Stray leading and trailing slashes from the sheet are removed before resolving */
        expect(extractLatLng).toHaveBeenCalledWith(
            "https://maps.app.goo.gl/abc",
        );
        expect(result?.location).toMatchObject({
            google: "https://www.google.com/maps/place/Home/@7.2906,80.6337,17z",
            latitude: 7.2906,
            longitude: 80.6337,
        });
    });

    it("keeps the URL as entered when no coordinates are found", async () => {
        vi.mocked(extractLatLng).mockResolvedValue(null);

        const result = await parseRow({
            ...row,
            "Google Maps": "https://maps.app.goo.gl/abc",
        });

        expect(result?.location).toMatchObject({
            google: "https://maps.app.goo.gl/abc",
            latitude: null,
            longitude: null,
        });
    });
});
