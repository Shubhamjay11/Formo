import { db } from "@/db";
import { users } from "@/db/schema/auth";
import {
  invites,
  memberships,
  organizations,
  type MembershipRole,
} from "@/db/schema/org";
import { randomBytes } from "node:crypto";

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

export async function createTestInvite(input: {
  orgId: string;
  email: string;
  createdBy: string;
  role?: Exclude<MembershipRole, "owner">;
  token?: string;
  expiresAt?: Date;
  acceptedAt?: Date | null;
}) {
  const [invite] = await db
    .insert(invites)
    .values({
      orgId: input.orgId,
      email: input.email.trim().toLowerCase(),
      role: input.role ?? "builder",
      token: input.token ?? randomBytes(32).toString("base64url"),
      expiresAt:
        input.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      acceptedAt: input.acceptedAt ?? null,
      createdBy: input.createdBy,
    })
    .returning();

  if (!invite) {
    throw new Error("createTestInvite failed");
  }

  return invite;
}
