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
