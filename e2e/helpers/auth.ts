import { createEmailVerificationToken } from "better-auth/api";
import pg from "pg";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for e2e helpers`);
  }
  return value;
}

function databaseNameFromUrl(url: string): string {
  const pathname = new URL(url).pathname.replace(/^\//, "");
  return pathname.split("/")[0] ?? "";
}

/** True only for an explicit dedicated test/CI DB (same bar as Vitest). */
export function isDedicatedTestDatabase(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  try {
    return databaseNameFromUrl(url).includes("_test");
  } catch {
    return false;
  }
}

let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({ connectionString: requireEnv("DATABASE_URL") });
  }
  return pool;
}

export async function closeDbPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export function uniqueEmail(prefix = "e2e"): string {
  const suffix = crypto.randomUUID().slice(0, 8);
  return `${prefix}-${suffix}@example.com`;
}

export async function mintVerifyUrl(
  email: string,
  callbackURL = "/dashboard",
): Promise<string> {
  const secret = requireEnv("BETTER_AUTH_SECRET");
  const token = await createEmailVerificationToken(secret, email);
  const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
  const params = new URLSearchParams({ token, callbackURL });
  return `${base}/api/auth/verify-email?${params.toString()}`;
}

export async function countUsersByEmail(email: string): Promise<number> {
  const result = await getPool().query<{ count: number }>(
    "select count(*)::int as count from users where lower(email) = lower($1)",
    [email],
  );
  return result.rows[0]?.count ?? 0;
}

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const result = await getPool().query<{ id: string }>(
    "select id from users where lower(email) = lower($1) limit 1",
    [email],
  );
  return result.rows[0]?.id ?? null;
}

/**
 * Destructive cleanup — only runs against a dedicated test/CI DATABASE_URL
 * (name contains `_test`). No-op otherwise.
 */
export async function cleanupUserByEmail(email: string): Promise<void> {
  if (!isDedicatedTestDatabase()) return;

  const userId = await findUserIdByEmail(email);
  if (!userId) return;

  const client = await getPool().connect();
  try {
    await client.query("begin");
    await client.query("delete from sessions where user_id = $1", [userId]);
    await client.query("delete from accounts where user_id = $1", [userId]);
    await client.query("delete from memberships where user_id = $1", [userId]);
    await client.query("delete from organizations where slug = $1", [userId]);
    await client.query("delete from users where id = $1", [userId]);
    await client.query("commit");
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}
