import { test, expect } from "@playwright/test";

test.describe("Directory filter - Name field", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/directory");
    });

    test("applying name filter updates URL", async ({ page }) => {
        await page.getByLabel("Name").fill("Sevana");
        await page.getByRole("button", { name: "Apply" }).click();
        await expect(page).toHaveURL(/name=Sevana/);
    });

    test("name filter value is restored when navigating to a filtered URL", async ({
        page,
    }) => {
        await page.goto("/directory?name=Sevana");
        await expect(page.getByLabel("Name")).toHaveValue("Sevana");
    });

    test("reset clears name field", async ({ page }) => {
        await page.getByLabel("Name").fill("Sevana");
        await page.getByRole("button", { name: "Apply" }).click();
        await expect(page).toHaveURL(/name=Sevana/);

        await page.getByRole("button", { name: "Reset" }).click();
        await expect(page.getByLabel("Name")).toHaveValue("");
    });
});

test.describe("Directory filter - City field", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/directory");
    });

    test("applying city filter updates URL", async ({ page }) => {
        await page.getByLabel("City").fill("Kandy");
        await page.getByRole("button", { name: "Apply" }).click();
        await expect(page).toHaveURL(/city=Kandy/);
    });

    test("city filter value is restored when navigating to a filtered URL", async ({
        page,
    }) => {
        await page.goto("/directory?city=Kandy");
        await expect(page.getByLabel("City")).toHaveValue("Kandy");
    });

    test("reset clears city field", async ({ page }) => {
        await page.getByLabel("City").fill("Kandy");
        await page.getByRole("button", { name: "Apply" }).click();
        await expect(page).toHaveURL(/city=Kandy/);

        await page.getByRole("button", { name: "Reset" }).click();
        await expect(page.getByLabel("City")).toHaveValue("");
    });
});

test.describe("Directory filter - Managed By field", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/directory");
    });

    test("applying managed by filter updates URL", async ({ page }) => {
        await page.getByLabel("Managed By").fill("Government");
        await page.getByRole("button", { name: "Apply" }).click();
        await expect(page).toHaveURL(/managedBy=Government/);
    });

    test("managed by filter value is restored when navigating to a filtered URL", async ({
        page,
    }) => {
        await page.goto("/directory?managedBy=Government");
        await expect(page.getByLabel("Managed By")).toHaveValue("Government");
    });

    test("reset clears managed by field", async ({ page }) => {
        await page.getByLabel("Managed By").fill("Government");
        await page.getByRole("button", { name: "Apply" }).click();
        await expect(page).toHaveURL(/managedBy=Government/);

        await page.getByRole("button", { name: "Reset" }).click();
        await expect(page.getByLabel("Managed By")).toHaveValue("");
    });
});

test.describe("Directory filter - Province field", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/directory");
    });

    test("applying province filter updates URL", async ({ page }) => {
        await page.getByLabel("Province").selectOption("Central");
        await page.getByRole("button", { name: "Apply" }).click();
        await expect(page).toHaveURL(/province=Central/);
    });

    test("province filter value is restored when navigating to a filtered URL", async ({
        page,
    }) => {
        await page.goto("/directory?province=Central");
        await expect(page.getByLabel("Province")).toHaveValue("Central");
    });

    test("selecting a province enables the district dropdown", async ({
        page,
    }) => {
        await expect(page.getByLabel("District")).toBeDisabled();
        await page.getByLabel("Province").selectOption("Central");
        await expect(page.getByLabel("District")).toBeEnabled();
    });

    test("district dropdown shows only districts for the selected province", async ({
        page,
    }) => {
        await page.getByLabel("Province").selectOption("Central");
        const districtSelect = page.getByLabel("District");
        await expect(districtSelect.locator("option", { hasText: "Kandy" })).toBeAttached();
        await expect(districtSelect.locator("option", { hasText: "Colombo" })).not.toBeAttached();
    });

    test("reset clears province field", async ({ page }) => {
        await page.getByLabel("Province").selectOption("Central");
        await page.getByRole("button", { name: "Apply" }).click();
        await expect(page).toHaveURL(/province=Central/);

        await page.getByRole("button", { name: "Reset" }).click();
        await expect(page.getByLabel("Province")).toHaveValue("");
    });
});

test.describe("Directory filter - District field", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/directory");
    });

    test("district dropdown is disabled when no province is selected", async ({
        page,
    }) => {
        await expect(page.getByLabel("District")).toBeDisabled();
    });

    test("applying district filter updates URL with province and district", async ({
        page,
    }) => {
        await page.getByLabel("Province").selectOption("Central");
        await page.getByLabel("District").selectOption("Kandy");
        await page.getByRole("button", { name: "Apply" }).click();
        await expect(page).toHaveURL(/province=Central/);
        await expect(page).toHaveURL(/district=Kandy/);
    });

    test("district filter values are restored when navigating to a filtered URL", async ({
        page,
    }) => {
        await page.goto("/directory?province=Central&district=Kandy");
        await expect(page.getByLabel("Province")).toHaveValue("Central");
        await expect(page.getByLabel("District")).toHaveValue("Kandy");
    });

    test("reset clears district field", async ({ page }) => {
        await page.getByLabel("Province").selectOption("Central");
        await page.getByLabel("District").selectOption("Kandy");
        await page.getByRole("button", { name: "Apply" }).click();
        await expect(page).toHaveURL(/district=Kandy/);

        await page.getByRole("button", { name: "Reset" }).click();
        await expect(page.getByLabel("District")).toBeDisabled();
    });
});

test.describe("Directory filter reset", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/directory");
    });

    test("reset clears all filter fields", async ({ page }) => {
        await page.getByLabel("Name").fill("Sevana");
        await page.getByLabel("City").fill("Kandy");
        await page.getByLabel("Managed By").fill("Government");
        await page.getByLabel("Province").selectOption("Central");

        await page.getByRole("button", { name: "Reset" }).click();

        await expect(page.getByLabel("Name")).toHaveValue("");
        await expect(page.getByLabel("City")).toHaveValue("");
        await expect(page.getByLabel("Managed By")).toHaveValue("");
        await expect(page.getByLabel("Province")).toHaveValue("");
    });

    test("reset navigates to /directory with no filter params", async ({
        page,
    }) => {
        await page.getByLabel("Province").selectOption("Western");
        await page.getByRole("button", { name: "Apply" }).click();
        await expect(page).toHaveURL(/province=Western/);

        await page.getByRole("button", { name: "Reset" }).click();
        await expect(page).toHaveURL(/\/directory\/?(\?.*)?$/, {
            timeout: 5000,
        });
        await expect(page).not.toHaveURL(/province=/);
    });

    test("reset button does not stay in loading state after resetting", async ({
        page,
    }) => {
        await page.getByLabel("Province").selectOption("Western");
        await page.getByRole("button", { name: "Apply" }).click();
        await expect(page).toHaveURL(/province=Western/);

        await page.getByRole("button", { name: "Reset" }).click();

        await expect(
            page.getByRole("button", { name: "Resetting" }),
        ).not.toBeVisible({ timeout: 5000 });
        await expect(page.getByRole("button", { name: "Reset" })).toBeEnabled({
            timeout: 5000,
        });
    });

    test("reset with no active filters does not show loading state", async ({
        page,
    }) => {
        await page.getByRole("button", { name: "Reset" }).click();

        await expect(
            page.getByRole("button", { name: "Resetting" }),
        ).not.toBeVisible();
        await expect(page.getByRole("button", { name: "Reset" })).toBeEnabled();
    });
});
