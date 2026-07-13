import { db, withOrg } from "@/db";
import { users } from "@/db/schema/auth";
import { memberships, organizations } from "@/db/schema/org";
import { inArray } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import {
  createTestMembership,
  createTestOrg,
  createTestUser,
} from "../factories";

async function cleanupUsers(userIds: string[]) {
  if (userIds.length === 0) return;
  await db.delete(memberships).where(inArray(memberships.userId, userIds));
  await db.delete(users).where(inArray(users.id, userIds));
}

async function cleanupOrgs(orgIds: string[]) {
  if (orgIds.length === 0) return;
  await db.delete(memberships).where(inArray(memberships.orgId, orgIds));
  await db.delete(organizations).where(inArray(organizations.id, orgIds));
}

describe("withOrg", () => {
  const userIds: string[] = [];
  const orgIds: string[] = [];

  afterEach(async () => {
    await cleanupUsers(userIds.splice(0));
    await cleanupOrgs(orgIds.splice(0));
  });

  it("scopes queries to a single org", async () => {
    const userA = await createTestUser({ name: "User A" });
    const userB = await createTestUser({ name: "User B" });
    userIds.push(userA.id, userB.id);

    const orgA = await createTestOrg({ name: "Org A" });
    const orgB = await createTestOrg({ name: "Org B" });
    orgIds.push(orgA.id, orgB.id);

    await createTestMembership({
      orgId: orgA.id,
      userId: userA.id,
      role: "owner",
    });
    await createTestMembership({
      orgId: orgB.id,
      userId: userB.id,
      role: "owner",
    });

    const scoped = await db
      .select()
      .from(memberships)
      .where(withOrg(memberships.orgId, orgA.id));

    expect(scoped).toHaveLength(1);
    expect(scoped[0]?.orgId).toBe(orgA.id);
    expect(scoped[0]?.userId).toBe(userA.id);
  });

  it("returns empty when org has no rows", async () => {
    const org = await createTestOrg();
    orgIds.push(org.id);

    const scoped = await db
      .select()
      .from(memberships)
      .where(withOrg(memberships.orgId, org.id));

    expect(scoped).toHaveLength(0);
  });
});
