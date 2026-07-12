import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

function databaseNameFromUrl(url: string): string {
  const pathname = new URL(url).pathname.replace(/^\//, "");
  return pathname.split("/")[0] ?? "";
}

const env = loadEnv("test", process.cwd(), "");
const testDatabaseUrl =
  env.TEST_DATABASE_URL || process.env.TEST_DATABASE_URL || "";

if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL is required for Vitest. Create a DB whose name contains _test (e.g. formo_test) and set TEST_DATABASE_URL. Refusing to use DATABASE_URL.",
  );
}

const dbName = databaseNameFromUrl(testDatabaseUrl);
if (!dbName.includes("_test")) {
  throw new Error(
    `TEST_DATABASE_URL database name must contain "_test" (got "${dbName}"). Refusing to run destructive tests.`,
  );
}

// Point app env at the test DB only — never fall back to DATABASE_URL.
process.env.DATABASE_URL = testDatabaseUrl;
process.env.BETTER_AUTH_SECRET =
  env.BETTER_AUTH_SECRET ||
  process.env.BETTER_AUTH_SECRET ||
  "dev-only-secret-min-32-characters-long";
process.env.BETTER_AUTH_URL =
  env.BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
process.env.RESEND_API_KEY =
  env.RESEND_API_KEY || process.env.RESEND_API_KEY || "re_test_dummy_key";
process.env.EMAIL_FROM =
  env.EMAIL_FROM || process.env.EMAIL_FROM || "Acme <hello@acme.com>";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
