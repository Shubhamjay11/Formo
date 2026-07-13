import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { memberships, organizations } from "@/db/schema/org";
import {
  createPersonalWorkspace,
  provisionPersonalWorkspaceOnSignup,
} from "@/modules/workspaces/service";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { createTestUser } from "../factories";

async function cleanupUserTree(userId: string) {
  await db
    .update(users)
    .set({ activeOrgId: null })
    .where(eq(users.id, userId));
  await db.delete(memberships).where(eq(memberships.userId, userId));
  await db.delete(organizations).where(eq(organizations.slug, userId));
  await db.delete(users).where(eq(users.id, userId));
}

describe("createPersonalWorkspace", () => {
  const createdUserIds: string[] = [];

  afterEach(async () => {
    for (const id of createdUserIds.splice(0)) {
      await cleanupUserTree(id);
    }
  });

  it("creates org named from first name with owner membership", async () => {
    const user = await createTestUser({ name: "Ada Lovelace" });
    createdUserIds.push(user.id);

    const org = await createPersonalWorkspace({
      id: user.id,
      name: user.name,
    });

    expect(org.name).toBe("Ada's workspace");
    expect(org.slug).toBe(user.id);

    const [membership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.orgId, org.id));

    expect(membership?.userId).toBe(user.id);
    expect(membership?.role).toBe("owner");

    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));
    expect(updatedUser?.activeOrgId).toBe(org.id);
  });

  it("rolls back org when membership insert fails", async () => {
    const ghostUserId = crypto.randomUUID();

    await expect(
      createPersonalWorkspace({
        id: ghostUserId,
        name: "Ghost User",
      }),
    ).rejects.toThrow();

    const orgs = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, ghostUserId));

    expect(orgs).toHaveLength(0);
  });
});

describe("provisionPersonalWorkspaceOnSignup", () => {
  const createdUserIds: string[] = [];
  const createdOrgIds: string[] = [];

  afterEach(async () => {
    for (const id of createdUserIds.splice(0)) {
      await cleanupUserTree(id);
    }
    for (const id of createdOrgIds.splice(0)) {
      await db.delete(organizations).where(eq(organizations.id, id));
    }
  });

  it("deletes the user when workspace provisioning fails", async () => {
    const user = await createTestUser({ name: "Grace Hopper" });
    createdUserIds.push(user.id);

    const [blocker] = await db
      .insert(organizations)
      .values({ name: "taken", slug: user.id })
      .returning();
    if (blocker) {
      createdOrgIds.push(blocker.id);
    }

    await expect(
      provisionPersonalWorkspaceOnSignup({
        id: user.id,
        name: user.name,
      }),
    ).rejects.toThrow();

    const found = await db.select().from(users).where(eq(users.id, user.id));
    expect(found).toHaveLength(0);
    createdUserIds.length = 0;
  });
});
