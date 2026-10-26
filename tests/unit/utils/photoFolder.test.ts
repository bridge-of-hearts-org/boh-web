import { describe, expect, it } from "vitest";

import { DEV_PHOTO_FOLDER, photoFolderFor } from "@/utils/photoFolder";

describe("photoFolderFor", () => {
    it("keeps production's photos at the top of the store", () => {
        expect(photoFolderFor("production")).toBe("");
    });

    it.each(["preview", "development", "", undefined])(
        "uses the dev folder for %j",
        (vercelEnv) => {
            expect(photoFolderFor(vercelEnv)).toBe(DEV_PHOTO_FOLDER);
        },
    );
});
