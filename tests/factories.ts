import { db } from "@/db";
import { users } from "@/db/schema/auth";
import {
  memberships,
  organizations,
  type MembershipRole,
} from "@/db/schema/org";

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

export async function createTestOrg(overrides?: {
  name?: string;
  slug?: string;
}) {
  const suffix = crypto.randomUUID().slice(0, 8);
  const [org] = await db
    .insert(organizations)
    .values({
      name: overrides?.name ?? `Test Org ${suffix}`,
      slug: overrides?.slug ?? `test-org-${suffix}`,
    })
    .returning();

  if (!org) {
    throw new Error("createTestOrg failed");
  }

  return org;
}

export async function createTestMembership(input: {
  orgId: string;
  userId: string;
  role?: MembershipRole;
}) {
  const [membership] = await db
    .insert(memberships)
    .values({
      orgId: input.orgId,
      userId: input.userId,
      role: input.role ?? "viewer",
    })
    .returning();

  if (!membership) {
    throw new Error("createTestMembership failed");
  }

  return membership;
}
