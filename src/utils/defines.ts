/* ----------- Vercel ----------- */

import { ChildCareFacility } from "@prisma/client";
import { removeKeys } from "./utils";

export const vercelStorageUrl =
    "https://hzhlx0obnpowbirz.public.blob.vercel-storage.com";

/* ----------- Administrative areas ----------- */

export const DistrictsList = [
    "Ampara",
    "Anuradhapura",
    "Badulla",
    "Batticaloa",
    "Colombo",
    "Galle",
    "Gampaha",
    "Hambantota",
    "Jaffna",
    "Kalutara",
    "Kandy",
    "Kegalle",
    "Kilinochchi",
    "Kurunegala",
    "Mannar",
    "Matale",
    "Matara",
    "Monaragala",
    "Mullaitivu",
    "Nuwara Eliya",
    "Polonnaruwa",
    "Puttalam",
    "Ratnapura",
    "Trincomalee",
    "Vavuniya",
] as const;

export const ProvincesList = [
    "Central",
    "Eastern",
    "North Central",
    "North Western",
    "Northern",
    "Sabaragamuwa",
    "Southern",
    "Uva",
    "Western",
] as const;

export type Province = (typeof ProvincesList)[number];
export type District = (typeof DistrictsList)[number];

export type ProvinceToDistrictType = {
    readonly [key in Province]: District[];
};

export const ProvinceToDistrict: ProvinceToDistrictType = {
    Northern: ["Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya"],
    "North Western": ["Puttalam", "Kurunegala"],
    Western: ["Gampaha", "Colombo", "Kalutara"],
    "North Central": ["Anuradhapura", "Polonnaruwa"],
    Central: ["Matale", "Kandy", "Nuwara Eliya"],
    Sabaragamuwa: ["Kegalle", "Ratnapura"],
    Eastern: ["Trincomalee", "Batticaloa", "Ampara"],
    Uva: ["Badulla", "Monaragala"],
    Southern: ["Hambantota", "Matara", "Galle"],
} as const;

export type DirectoryFilterType = {
    name: string;
    city: string;
    managedBy: string;
    district: District | "";
    province: Province | "";
};

export const emptyFilter: DirectoryFilterType = {
    name: "",
    city: "",
    managedBy: "",
    district: "",
    province: "",
};

export type ChildCareFacilityInput = Omit<
    ChildCareFacility,
    "id" | "createdAt" | "updatedAt"
>;

export const emptyChildCareFacilityDbObject: ChildCareFacility = {
    id: "",
    name: "",
    slug: "",
    type: "",
    managedBy: "",
    description: "",
    location: {
        address: "",
        city: "",
        divisionalSecretariat: "",
        district: "",
        province: "",
        google: "",
        latitude: 0,
        longitude: 0,
    },
    contact: {
        phone: [],
        email: [],
        website: "",
        facebook: "",
        instagram: "",
    },
    genders: "unknown",
    occupancy: { male: 0, female: 0, total: 0 },
    ageRanges: { male: "", female: "", all: "" },
    createdAt: new Date(),
    updatedAt: new Date(),
    sources: [],
    photos: [],
};
