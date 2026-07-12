import { db } from "@/db";
import { users } from "@/db/schema/auth";

/**
 * Test data factories. All unit + e2e tests create data through these —
 * never hand-rolled inline objects.
 */
export async function createTestUser(overrides?: {
  name?: string;
  email?: string;
}) {
  const suffix = crypto.randomUUID().slice(0, 8);
  const [user] = await db
    .insert(users)
    .values({
      name: overrides?.name ?? "Ada Lovelace",
      email: overrides?.email ?? `ada-${suffix}@example.com`,
      emailVerified: false,
    })
    .returning();

  if (!user) {
    throw new Error("createTestUser failed");
  }

  return user;
}
