import { defineConfig, devices } from "@playwright/test";
import { loadEnvFile, useTestDatabaseForE2e } from "./e2e/helpers/env";

loadEnvFile();
const databaseUrl = useTestDatabaseForE2e();

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

const e2eEnv: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  ),
  DATABASE_URL: databaseUrl,
  TEST_DATABASE_URL: databaseUrl,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? baseURL,
  PLAYWRIGHT_BASE_URL: baseURL,
};

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm build && pnpm start",
    url: baseURL,
    // Always start with TEST_DATABASE_URL — do not reuse a dev server on formo/prod.
    // Opt in with E2E_REUSE_SERVER=1 only when that server already uses the test DB.
    reuseExistingServer: process.env.E2E_REUSE_SERVER === "1",
    timeout: 420_000,
    env: e2eEnv,
  },
});
