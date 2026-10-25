/* Validation and parsing for the admin facility form (EditForm) */

import { ChildCareFacility } from "@prisma/client";
import {
    hasCoordinates,
    isValidLatitude,
    isValidLongitude,
    LatLng,
} from "@/utils/maps";

export const validateFacility = (data: ChildCareFacility) => {
    if (!data.slug) {
        return "Slug is required";
    }

    if (!data.name) {
        return "Name is required";
    }

    return "success";
};

export const coordsToText = (
    location: ChildCareFacility["location"],
): [string, string] => {
    if (!hasCoordinates(location)) {
        return ["", ""];
    }

    return [String(location.latitude), String(location.longitude)];
};

const COORDINATE_PATTERN = /^-?\d+(\.\d+)?$/;

/* Parses the latitude/longitude inputs. Both empty is valid and means "no coordinates". */
export const parseCoordinates = (
    latitudeText: string,
    longitudeText: string,
): { coords: LatLng | null } | { error: string } => {
    const lat = latitudeText.trim();
    const lng = longitudeText.trim();

    if (!lat && !lng) {
        return { coords: null };
    }

    if (!lat || !lng) {
        return {
            error: "Enter both latitude and longitude, or leave both empty",
        };
    }

    const latitude = COORDINATE_PATTERN.test(lat) ? Number(lat) : NaN;
    const longitude = COORDINATE_PATTERN.test(lng) ? Number(lng) : NaN;

    if (!isValidLatitude(latitude)) {
        return { error: "Latitude must be a number between -90 and 90" };
    }

    if (!isValidLongitude(longitude)) {
        return { error: "Longitude must be a number between -180 and 180" };
    }

    return { coords: { latitude, longitude } };
};
