import { test, expect, Locator, Page } from "@playwright/test";

/* Enough listings on one page that some have several photos, whichever
   database the deployment reads */
const DIRECTORY_URL = "/directory?itemsPerPage=100";

/* The first listing carousel that has a control named `name` */
const carouselWith = (page: Page, name: string | RegExp): Locator =>
    page
        .getByTestId("listing-photo-carousel")
        .filter({ has: page.getByRole("button", { name }) })
        .first();

/* The number of photos a carousel has, from its photo's alt text */
const photoCount = async (photo: Locator): Promise<number> => {
    const alt = (await photo.getAttribute("alt")) ?? "";
    return Number(alt.match(/^Photo \d+ of (\d+)/)?.[1]);
};

test.describe("Directory listing photo carousel", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(DIRECTORY_URL);
    });

    test("next and previous buttons change the photo and wrap around", async ({
        page,
    }) => {
        const listing = carouselWith(page, "Next photo");
        const photo = listing.locator("img");
        await expect(photo).toHaveAttribute("alt", /^Photo 1 of \d+/, {
            timeout: 10000,
        });
        const firstSrc = (await photo.getAttribute("src"))!;
        const count = await photoCount(photo);

        await listing.getByRole("button", { name: "Next photo" }).click();
        await expect(photo).toHaveAttribute("alt", /^Photo 2 of /);
        await expect(photo).not.toHaveAttribute("src", firstSrc);

        await listing.getByRole("button", { name: "Previous photo" }).click();
        await expect(photo).toHaveAttribute("alt", /^Photo 1 of /);
        await expect(photo).toHaveAttribute("src", firstSrc);

        await listing.getByRole("button", { name: "Previous photo" }).click();
        await expect(photo).toHaveAttribute(
            "alt",
            new RegExp(`^Photo ${count} of `),
        );
    });

    test("a dot shows that photo", async ({ page }) => {
        const listing = carouselWith(page, /^Show photo 2 of /);
        const dot = listing.getByRole("button", { name: /^Show photo 2 of / });
        await dot.click();
        await expect(listing.locator("img")).toHaveAttribute(
            "alt",
            /^Photo 2 of /,
        );
        await expect(dot).toHaveAttribute("aria-current", "true");
    });

    test("the photo still links to the facility page", async ({ page }) => {
        const listing = carouselWith(page, "Next photo");
        const href = (await listing.locator("a").getAttribute("href"))!;
        await listing.getByRole("button", { name: "Next photo" }).click();
        await listing.locator("img").click();
        await expect(page).toHaveURL(new RegExp(`${href}$`));
    });
});

test.describe("Directory listing photo carousel on a touch screen", () => {
    test.use({ hasTouch: true });

    /* Dispatches a one-finger swipe across the carousel */
    const swipe = async (listing: Locator, fromX: number, toX: number) => {
        await listing.dispatchEvent("touchstart", {
            touches: [{ identifier: 0, clientX: fromX, clientY: 100 }],
            changedTouches: [{ identifier: 0, clientX: fromX, clientY: 100 }],
        });
        await listing.dispatchEvent("touchend", {
            touches: [],
            changedTouches: [{ identifier: 0, clientX: toX, clientY: 100 }],
        });
    };

    test("swiping changes the photo", async ({ page }) => {
        await page.goto(DIRECTORY_URL);
        const listing = carouselWith(page, "Next photo");
        const photo = listing.locator("img");
        await expect(photo).toHaveAttribute("alt", /^Photo 1 of \d+/, {
            timeout: 10000,
        });
        const count = await photoCount(photo);

        await swipe(listing, 150, 50);
        await expect(photo).toHaveAttribute("alt", /^Photo 2 of /);

        await swipe(listing, 50, 150);
        await swipe(listing, 50, 150);
        await expect(photo).toHaveAttribute(
            "alt",
            new RegExp(`^Photo ${count} of `),
        );
    });
});
