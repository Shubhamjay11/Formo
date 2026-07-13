import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { memberships, organizations } from "@/db/schema/org";
import {
  AuthorizationError,
  requireRole,
  roleAtLeast,
} from "@/server/authz";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import {
  createTestMembership,
  createTestOrg,
  createTestUser,
} from "../factories";

async function cleanupUserTree(userId: string) {
  await db.delete(memberships).where(eq(memberships.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}

async function cleanupOrg(orgId: string) {
  await db.delete(memberships).where(eq(memberships.orgId, orgId));
  await db.delete(organizations).where(eq(organizations.id, orgId));
}

describe("roleAtLeast", () => {
  it("orders roles viewer < builder < admin < owner", () => {
    expect(roleAtLeast("viewer", "viewer")).toBe(true);
    expect(roleAtLeast("viewer", "builder")).toBe(false);
    expect(roleAtLeast("builder", "viewer")).toBe(true);
    expect(roleAtLeast("builder", "admin")).toBe(false);
    expect(roleAtLeast("admin", "builder")).toBe(true);
    expect(roleAtLeast("admin", "owner")).toBe(false);
    expect(roleAtLeast("owner", "admin")).toBe(true);
    expect(roleAtLeast("owner", "owner")).toBe(true);
  });

  it("equal ranks pass", () => {
    for (const role of ["viewer", "builder", "admin", "owner"] as const) {
      expect(roleAtLeast(role, role)).toBe(true);
    }
  });
});

describe("requireRole", () => {
  const userIds: string[] = [];
  const orgIds: string[] = [];

  afterEach(async () => {
    for (const id of userIds.splice(0)) {
      await cleanupUserTree(id);
    }
    for (const id of orgIds.splice(0)) {
      await cleanupOrg(id);
    }
  });

  it("allows owner when minRole is admin", async () => {
    const user = await createTestUser();
    userIds.push(user.id);
    const org = await createTestOrg();
    orgIds.push(org.id);
    await createTestMembership({
      orgId: org.id,
      userId: user.id,
      role: "owner",
    });

    await expect(requireRole(org.id, user.id, "admin")).resolves.toEqual({
      role: "owner",
    });
  });

  it("rejects viewer when minRole is builder", async () => {
    const user = await createTestUser();
    userIds.push(user.id);
    const org = await createTestOrg();
    orgIds.push(org.id);
    await createTestMembership({
      orgId: org.id,
      userId: user.id,
      role: "viewer",
    });

    await expect(requireRole(org.id, user.id, "builder")).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });

  it("rejects non-members", async () => {
    const user = await createTestUser();
    userIds.push(user.id);
    const org = await createTestOrg();
    orgIds.push(org.id);

    await expect(requireRole(org.id, user.id, "viewer")).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });
});
