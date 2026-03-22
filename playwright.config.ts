import { defineConfig, devices } from "@playwright/test";

const baseURL =
    process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
    testDir: "./tests/e2e",
    fullyParallel: true,
    reporter: "html",
    use: {
        baseURL,
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    // Start the dev server automatically when running locally
    webServer: process.env.PLAYWRIGHT_TEST_BASE_URL
        ? undefined
        : {
              command: "npm run dev",
              url: "http://localhost:3000",
              reuseExistingServer: true,
              timeout: 120000,
          },
});
