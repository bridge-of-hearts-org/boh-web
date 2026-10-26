import { test, expect, Locator, Page } from "@playwright/test";

/* Enough listings on one page that some have several photos, whichever
   database the deployment reads */
const DIRECTORY_URL = "/directory?itemsPerPage=100";

/* Opens the page of the first facility with several photos, found through
   the Directory listing carousels */
const openFacilityWithPhotos = async (page: Page) => {
    await page.goto(DIRECTORY_URL);
    const listing = page
        .getByTestId("listing-photo-carousel")
        .filter({ has: page.getByRole("button", { name: "Next photo" }) })
        .first();
    const href = (await listing.locator("a").getAttribute("href"))!;
    await page.goto(href);
};

/* The enlarged photo in the overlay */
const enlargedPhoto = (overlay: Locator) => overlay.locator("img");

/* The number of photos, from the enlarged photo's alt text */
const photoCount = async (photo: Locator): Promise<number> => {
    const alt = (await photo.getAttribute("alt")) ?? "";
    return Number(alt.match(/^Photo \d+ of (\d+)/)?.[1]);
};

test.describe("Moving through enlarged photos", () => {
    test.beforeEach(async ({ page }) => {
        await openFacilityWithPhotos(page);
        await page.locator(".carousel-scrollbar img").first().click();
    });

    test("next and previous buttons move through the photos and wrap around", async ({
        page,
    }) => {
        const overlay = page.locator(".fixed.inset-0");
        const photo = enlargedPhoto(overlay);
        await expect(photo).toHaveAttribute("alt", /^Photo 1 of \d+/);
        const count = await photoCount(photo);

        await overlay.getByRole("button", { name: "Next photo" }).click();
        await expect(overlay).toBeVisible();
        await expect(photo).toHaveAttribute("alt", /^Photo 2 of /);

        await overlay.getByRole("button", { name: "Previous photo" }).click();
        await expect(photo).toHaveAttribute("alt", /^Photo 1 of /);

        await overlay.getByRole("button", { name: "Previous photo" }).click();
        await expect(photo).toHaveAttribute(
            "alt",
            new RegExp(`^Photo ${count} of `),
        );
        await expect(overlay).toContainText(`${count} / ${count}`);
    });

    test("arrow keys move through the photos", async ({ page }) => {
        const overlay = page.locator(".fixed.inset-0");
        const photo = enlargedPhoto(overlay);
        await expect(photo).toHaveAttribute("alt", /^Photo 1 of /);

        await page.keyboard.press("ArrowRight");
        await expect(photo).toHaveAttribute("alt", /^Photo 2 of /);

        await page.keyboard.press("ArrowLeft");
        await expect(photo).toHaveAttribute("alt", /^Photo 1 of /);
    });

    test("opening another thumbnail enlarges that photo", async ({ page }) => {
        await page.keyboard.press("Escape");
        await page.locator(".carousel-scrollbar img").nth(1).click();
        await expect(
            enlargedPhoto(page.locator(".fixed.inset-0")),
        ).toHaveAttribute("alt", /^Photo 2 of /);
    });
});

test.describe("Moving through enlarged photos on a touch screen", () => {
    test.use({ hasTouch: true });

    /* Dispatches a one-finger swipe across the overlay */
    const swipe = async (overlay: Locator, fromX: number, toX: number) => {
        await overlay.dispatchEvent("touchstart", {
            touches: [{ identifier: 0, clientX: fromX, clientY: 300 }],
            changedTouches: [{ identifier: 0, clientX: fromX, clientY: 300 }],
        });
        await overlay.dispatchEvent("touchend", {
            touches: [],
            changedTouches: [{ identifier: 0, clientX: toX, clientY: 300 }],
        });
    };

    test("swiping moves through the photos", async ({ page }) => {
        await openFacilityWithPhotos(page);
        await page.locator(".carousel-scrollbar img").first().click();
        const overlay = page.locator(".fixed.inset-0");
        const photo = enlargedPhoto(overlay);
        await expect(photo).toHaveAttribute("alt", /^Photo 1 of /);

        await swipe(overlay, 300, 100);
        await expect(photo).toHaveAttribute("alt", /^Photo 2 of /);

        await swipe(overlay, 100, 300);
        await expect(photo).toHaveAttribute("alt", /^Photo 1 of /);
    });
});
