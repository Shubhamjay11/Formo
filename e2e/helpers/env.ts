import fs from "node:fs";
import path from "node:path";

/**
 * Load .env into process.env without printing values.
 * Does not overwrite keys already set in the environment.
 */
export function loadEnvFile(filePath = path.resolve(process.cwd(), ".env")) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

/**
 * Point e2e at the dedicated test DB. Throws if TEST_DATABASE_URL is missing
 * or its database name does not contain `_test`.
 */
export function useTestDatabaseForE2e() {
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error(
      "TEST_DATABASE_URL is required for e2e. Use a DB whose name contains _test.",
    );
  }
  const pathname = new URL(testUrl).pathname.replace(/^\//, "");
  const dbName = pathname.split("/")[0] ?? "";
  if (!dbName.includes("_test")) {
    throw new Error(
      `TEST_DATABASE_URL database name must contain "_test" (got "${dbName}").`,
    );
  }
  process.env.DATABASE_URL = testUrl;
  return testUrl;
}
