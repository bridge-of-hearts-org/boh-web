import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
    test: {
        environment: "node",
        /* Keeps Vitest away from the Playwright specs in tests/e2e */
        include: ["tests/unit/**/*.test.ts"],
        restoreMocks: true,
        unstubEnvs: true,
        unstubGlobals: true,
    },
});
