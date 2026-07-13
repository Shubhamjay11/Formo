import { db } from "@/db";
import { users } from "@/db/schema/auth";
import {
  auditLogs,
  invites,
  memberships,
  organizations,
} from "@/db/schema/org";
import { sendEmail } from "@/lib/email";
import {
  AuthorizationError,
  MemberError,
  removeMember,
  resendInvite,
  updateMemberRole,
} from "@/modules/workspaces/service";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createTestInvite,
  createTestMembership,
  createTestOrg,
  createTestUser,
} from "../factories";

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async () => undefined),
}));

const sendEmailMock = vi.mocked(sendEmail);

async function cleanupUser(userId: string) {
  await db.delete(memberships).where(eq(memberships.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}

async function cleanupOrg(orgId: string) {
  await db.delete(auditLogs).where(eq(auditLogs.orgId, orgId));
  await db.delete(invites).where(eq(invites.orgId, orgId));
  await db.delete(memberships).where(eq(memberships.orgId, orgId));
  await db.delete(organizations).where(eq(organizations.id, orgId));
}

describe("member management service", () => {
  const userIds: string[] = [];
  const orgIds: string[] = [];

  beforeEach(() => {
    sendEmailMock.mockClear();
  });

  afterEach(async () => {
    for (const orgId of orgIds.splice(0)) {
      await cleanupOrg(orgId);
    }
    for (const userId of userIds.splice(0)) {
      await cleanupUser(userId);
    }
  });

  async function setupOrgWithRoles() {
    const owner = await createTestUser({ name: "Owner" });
    const admin = await createTestUser({ name: "Admin" });
    const builder = await createTestUser({ name: "Builder" });
    const viewer = await createTestUser({ name: "Viewer" });
    userIds.push(owner.id, admin.id, builder.id, viewer.id);

    const org = await createTestOrg();
    orgIds.push(org.id);

    const ownerMembership = await createTestMembership({
      orgId: org.id,
      userId: owner.id,
      role: "owner",
    });
    const adminMembership = await createTestMembership({
      orgId: org.id,
      userId: admin.id,
      role: "admin",
    });
    const builderMembership = await createTestMembership({
      orgId: org.id,
      userId: builder.id,
      role: "builder",
    });
    const viewerMembership = await createTestMembership({
      orgId: org.id,
      userId: viewer.id,
      role: "viewer",
    });

    return {
      org,
      owner,
      admin,
      builder,
      viewer,
      ownerMembership,
      adminMembership,
      builderMembership,
      viewerMembership,
    };
  }

  it("allows admin to update a non-owner role", async () => {
    const { org, admin, builderMembership } = await setupOrgWithRoles();

    const updated = await updateMemberRole({
      orgId: org.id,
      membershipId: builderMembership.id,
      role: "viewer",
      actorId: admin.id,
    });

    expect(updated.role).toBe("viewer");
  });

  it("allows admin to remove a non-owner", async () => {
    const { org, admin, viewerMembership } = await setupOrgWithRoles();

    await removeMember({
      orgId: org.id,
      membershipId: viewerMembership.id,
      actorId: admin.id,
    });

    const [gone] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.id, viewerMembership.id))
      .limit(1);
    expect(gone).toBeUndefined();
  });

  it("forbids viewer and builder from updating or removing members", async () => {
    const { org, builder, viewer, adminMembership, viewerMembership } =
      await setupOrgWithRoles();

    await expect(
      updateMemberRole({
        orgId: org.id,
        membershipId: adminMembership.id,
        role: "viewer",
        actorId: viewer.id,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);

    await expect(
      removeMember({
        orgId: org.id,
        membershipId: viewerMembership.id,
        actorId: builder.id,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("blocks demoting or removing the last owner", async () => {
    const { org, owner, admin, ownerMembership } = await setupOrgWithRoles();

    await expect(
      updateMemberRole({
        orgId: org.id,
        membershipId: ownerMembership.id,
        role: "admin",
        actorId: owner.id,
      }),
    ).rejects.toMatchObject({
      code: "LAST_OWNER",
    } satisfies Partial<MemberError>);

    await expect(
      removeMember({
        orgId: org.id,
        membershipId: ownerMembership.id,
        actorId: admin.id,
      }),
    ).rejects.toMatchObject({
      code: "LAST_OWNER",
    } satisfies Partial<MemberError>);
  });

  it("resends invite by extending expiry and forbids non-admin", async () => {
    const { org, owner, viewer } = await setupOrgWithRoles();
    const nearExpiry = new Date(Date.now() + 60 * 60 * 1000);
    const invite = await createTestInvite({
      orgId: org.id,
      email: `pending-${crypto.randomUUID().slice(0, 8)}@example.com`,
      createdBy: owner.id,
      role: "builder",
      expiresAt: nearExpiry,
    });

    await expect(
      resendInvite({
        orgId: org.id,
        inviteId: invite.id,
        actorId: viewer.id,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);

    const updated = await resendInvite({
      orgId: org.id,
      inviteId: invite.id,
      actorId: owner.id,
    });

    expect(updated.expiresAt.getTime()).toBeGreaterThan(nearExpiry.getTime());
    expect(sendEmailMock).toHaveBeenCalled();
  });
});
