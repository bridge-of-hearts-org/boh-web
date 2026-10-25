import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";

import { describeFacilityWriteError } from "@/utils/dbErrors";

const prismaError = (code: string, meta?: Record<string, unknown>) =>
    new Prisma.PrismaClientKnownRequestError("Raw Prisma message", {
        code: code,
        clientVersion: "test",
        meta: meta,
    });

describe("describeFacilityWriteError", () => {
    it.each([
        ["an index name", "ChildCareFacility_slug_key"],
        ["a field list", ["slug"]],
    ])("explains a duplicate slug named by %s", (_, target) => {
        expect(
            describeFacilityWriteError(prismaError("P2002", { target })),
        ).toBe("A facility with this slug already exists");
    });

    it.each([
        ["an index name", "ChildCareFacility_name_key"],
        ["a field list", ["name"]],
    ])("explains a duplicate name named by %s", (_, target) => {
        expect(
            describeFacilityWriteError(prismaError("P2002", { target })),
        ).toBe("A facility with this name already exists");
    });

    it("explains other unique constraint failures without the raw message", () => {
        expect(describeFacilityWriteError(prismaError("P2002"))).toBe(
            "A facility with these details already exists",
        );
        expect(
            describeFacilityWriteError(
                prismaError("P2002", { target: "ChildCareFacility_other_key" }),
            ),
        ).toBe("A facility with these details already exists");
    });

    it("explains an update of a facility that no longer exists", () => {
        expect(describeFacilityWriteError(prismaError("P2025"))).toBe(
            "This facility no longer exists",
        );
    });

    it("falls back to the message of other errors", () => {
        expect(describeFacilityWriteError(prismaError("P2000"))).toBe(
            "Raw Prisma message",
        );
        expect(describeFacilityWriteError(new Error("Connection lost"))).toBe(
            "Connection lost",
        );
    });

    it("describes errors that aren't Error objects", () => {
        expect(describeFacilityWriteError("boom")).toBe("Unknown Error: boom");
    });
});
