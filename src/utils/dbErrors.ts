/* Turns errors from facility writes into messages an admin can act on */

import { Prisma } from "@prisma/client";

/* Unique constraint failed */
const UNIQUE_CONSTRAINT = "P2002";
/* The record to update doesn't exist */
const RECORD_NOT_FOUND = "P2025";

/* Prisma names the violated constraint by its fields (["slug"]) on some
   databases and by its index name ("ChildCareFacility_slug_key") on others */
const violatesUniqueField = (target: unknown, field: string): boolean => {
    const targets = Array.isArray(target) ? target : [target];

    return targets.some(
        (entry) =>
            typeof entry === "string" &&
            (entry === field || entry.includes(`_${field}_`)),
    );
};

export const describeFacilityWriteError = (error: unknown): string => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === UNIQUE_CONSTRAINT) {
            const target = error.meta?.target;

            if (violatesUniqueField(target, "slug")) {
                return "A facility with this slug already exists";
            }

            if (violatesUniqueField(target, "name")) {
                return "A facility with this name already exists";
            }

            return "A facility with these details already exists";
        }

        if (error.code === RECORD_NOT_FOUND) {
            return "This facility no longer exists";
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return `Unknown Error: ${error}`;
};
