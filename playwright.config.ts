import { defineConfig, devices } from "@playwright/test";

/**
 * Deterministic e2e configuration.
 *
 * Loops depend on stable signals: a flaky e2e suite is the #1 way an
 * autonomous fix loop burns budget chasing ghosts. Everything here is
 * pinned — viewport, locale, timezone, reduced motion, single worker —
 * so a red run means the app changed, not the environment.
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1280, height: 800 },
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "UTC",
    contextOptions: { reducedMotion: "reduce" },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
