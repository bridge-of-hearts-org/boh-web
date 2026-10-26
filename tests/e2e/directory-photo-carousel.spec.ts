import { test, expect, Page } from "@playwright/test";

// A facility we know exists with more than one photo
const FACILITY_NAME = "Children of Joy";
const FACILITY_SLUG = "children-of-joy-childrens-home-wattala";

test.describe("Directory listing photo carousel", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/directory?name=${encodeURIComponent(FACILITY_NAME)}`);
    });

    const carousel = (page: Page) =>
        page.getByTestId("listing-photo-carousel").filter({
            has: page.locator(`a[href="/facility/${FACILITY_SLUG}"]`),
        });

    test("next and previous buttons change the photo and wrap around", async ({
        page,
    }) => {
        const listing = carousel(page);
        const photo = listing.locator("img");
        await expect(photo).toHaveAttribute("alt", /^Photo 1 of \d+/, {
            timeout: 10000,
        });
        const firstSrc = await photo.getAttribute("src");
        const count = Number(
            (await photo.getAttribute("alt"))!.match(/of (\d+)/)![1],
        );

        await listing.getByRole("button", { name: "Next photo" }).click();
        await expect(photo).toHaveAttribute("alt", /^Photo 2 of /);
        await expect(photo).not.toHaveAttribute("src", firstSrc!);

        await listing.getByRole("button", { name: "Previous photo" }).click();
        await expect(photo).toHaveAttribute("alt", /^Photo 1 of /);
        await expect(photo).toHaveAttribute("src", firstSrc!);

        await listing.getByRole("button", { name: "Previous photo" }).click();
        await expect(photo).toHaveAttribute(
            "alt",
            new RegExp(`^Photo ${count} of `),
        );
    });

    test("a dot shows that photo", async ({ page }) => {
        const listing = carousel(page);
        await listing
            .getByRole("button", { name: /^Show photo 2 of / })
            .click();
        await expect(listing.locator("img")).toHaveAttribute(
            "alt",
            /^Photo 2 of /,
        );
        await expect(
            listing.getByRole("button", { name: /^Show photo 2 of / }),
        ).toHaveAttribute("aria-current", "true");
    });

    test("the photo still links to the facility page", async ({ page }) => {
        const listing = carousel(page);
        await listing.getByRole("button", { name: "Next photo" }).click();
        await listing.locator("img").click();
        await expect(page).toHaveURL(new RegExp(`/facility/${FACILITY_SLUG}$`));
    });
});
