import { db } from "@/db";
import { users } from "@/db/schema/auth";
import {
  auditLogs,
  invites,
  memberships,
  organizations,
} from "@/db/schema/org";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import {
  acceptInvite,
  AuthorizationError,
  createInvite,
  InviteError,
  revokeInvite,
  toPublicInvite,
} from "@/modules/workspaces/service";
import { and, eq } from "drizzle-orm";
import type { ReactElement } from "react";
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

type CapturedInviteEmail = {
  to: string;
  subject: string;
  react: ReactElement<{
    url: string;
    orgName: string;
    role: string;
    inviterName: string;
  }>;
};

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

describe("invite service", () => {
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

  async function setupOwnerOrg() {
    const owner = await createTestUser({ name: "Owner" });
    userIds.push(owner.id);
    const org = await createTestOrg();
    orgIds.push(org.id);
    await createTestMembership({
      orgId: org.id,
      userId: owner.id,
      role: "owner",
    });
    return { owner, org };
  }

  it("sends invite email with working /invite/{token} link", async () => {
    const { owner, org } = await setupOwnerOrg();
    const email = `invite-mail-${crypto.randomUUID().slice(0, 8)}@example.com`;

    const invite = await createInvite({
      orgId: org.id,
      email,
      role: "viewer",
      createdBy: owner.id,
    });

    expect(sendEmailMock).toHaveBeenCalled();
    const captured = sendEmailMock.mock.calls
      .map((c) => c[0] as CapturedInviteEmail)
      .find((c) => c.to === email.toLowerCase());
    expect(captured).toBeDefined();
    expect(captured!.react.props.url).toBe(
      `${env.BETTER_AUTH_URL}/invite/${invite.token}`,
    );
    expect(captured!.react.props.orgName).toBe(org.name);
    expect(captured!.react.props.role).toBe("viewer");
    expect(captured!.react.props.inviterName).toBe("Owner");
  });

  it("creates invite, accept adds membership and writes audits", async () => {
    const { owner, org } = await setupOwnerOrg();
    const invitee = await createTestUser({
      name: "Invitee",
      email: `invitee-${crypto.randomUUID().slice(0, 8)}@example.com`,
    });
    userIds.push(invitee.id);

    const invite = await createInvite({
      orgId: org.id,
      email: invitee.email,
      role: "builder",
      createdBy: owner.id,
    });

    expect(invite.token).toBeTruthy();
    expect(invite.email).toBe(invitee.email.toLowerCase());

    const createdAudits = await db
      .select()
      .from(auditLogs)
      .where(
        and(eq(auditLogs.orgId, org.id), eq(auditLogs.action, "invite.created")),
      );
    expect(createdAudits).toHaveLength(1);

    const { membership, alreadyMember } = await acceptInvite({
      token: invite.token,
      userId: invitee.id,
      userEmail: invitee.email,
    });

    expect(alreadyMember).toBe(false);
    expect(membership.role).toBe("builder");
    expect(membership.userId).toBe(invitee.id);

    const acceptedAudits = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.orgId, org.id),
          eq(auditLogs.action, "invite.accepted"),
        ),
      );
    expect(acceptedAudits).toHaveLength(1);

    const [updated] = await db
      .select()
      .from(invites)
      .where(eq(invites.id, invite.id));
    expect(updated?.acceptedAt).toBeTruthy();
  });

  it("rejects expired or unknown token when not a member", async () => {
    const { owner, org } = await setupOwnerOrg();
    const invitee = await createTestUser({
      email: `expired-${crypto.randomUUID().slice(0, 8)}@example.com`,
    });
    userIds.push(invitee.id);

    const expired = await createTestInvite({
      orgId: org.id,
      email: invitee.email,
      createdBy: owner.id,
      expiresAt: new Date(Date.now() - 60_000),
    });

    await expect(
      acceptInvite({
        token: expired.token,
        userId: invitee.id,
        userEmail: invitee.email,
      }),
    ).rejects.toMatchObject({ code: "INVITE_INVALID" } satisfies Partial<InviteError>);

    await expect(
      acceptInvite({
        token: "not-a-real-token",
        userId: invitee.id,
        userEmail: invitee.email,
      }),
    ).rejects.toMatchObject({ code: "INVITE_INVALID" });
  });

  it("rejects email mismatch", async () => {
    const { owner, org } = await setupOwnerOrg();
    const invite = await createTestInvite({
      orgId: org.id,
      email: "target@example.com",
      createdBy: owner.id,
    });
    const other = await createTestUser({
      email: `other-${crypto.randomUUID().slice(0, 8)}@example.com`,
    });
    userIds.push(other.id);

    await expect(
      acceptInvite({
        token: invite.token,
        userId: other.id,
        userEmail: other.email,
      }),
    ).rejects.toMatchObject({ code: "EMAIL_MISMATCH" });
  });

  it("accept twice is idempotent with a single membership", async () => {
    const { owner, org } = await setupOwnerOrg();
    const invitee = await createTestUser({
      email: `twice-${crypto.randomUUID().slice(0, 8)}@example.com`,
    });
    userIds.push(invitee.id);

    const invite = await createInvite({
      orgId: org.id,
      email: invitee.email,
      role: "viewer",
      createdBy: owner.id,
    });

    const first = await acceptInvite({
      token: invite.token,
      userId: invitee.id,
      userEmail: invitee.email,
    });
    expect(first.alreadyMember).toBe(false);

    const second = await acceptInvite({
      token: invite.token,
      userId: invitee.id,
      userEmail: invitee.email,
    });
    expect(second.alreadyMember).toBe(true);
    expect(second.membership.id).toBe(first.membership.id);

    const rows = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.orgId, org.id),
          eq(memberships.userId, invitee.id),
        ),
      );
    expect(rows).toHaveLength(1);
  });

  it("re-accept after expiry succeeds when membership already exists", async () => {
    const { owner, org } = await setupOwnerOrg();
    const invitee = await createTestUser({
      email: `reaccept-${crypto.randomUUID().slice(0, 8)}@example.com`,
    });
    userIds.push(invitee.id);

    const invite = await createTestInvite({
      orgId: org.id,
      email: invitee.email,
      createdBy: owner.id,
      role: "builder",
      expiresAt: new Date(Date.now() - 60_000),
      acceptedAt: new Date(Date.now() - 120_000),
    });
    const membership = await createTestMembership({
      orgId: org.id,
      userId: invitee.id,
      role: "builder",
    });

    const result = await acceptInvite({
      token: invite.token,
      userId: invitee.id,
      userEmail: invitee.email,
    });

    expect(result.alreadyMember).toBe(true);
    expect(result.membership.id).toBe(membership.id);
  });

  it("blocks create when invitee is already a member", async () => {
    const { owner, org } = await setupOwnerOrg();
    const member = await createTestUser({
      email: `member-${crypto.randomUUID().slice(0, 8)}@example.com`,
    });
    userIds.push(member.id);
    await createTestMembership({
      orgId: org.id,
      userId: member.id,
      role: "viewer",
    });

    await expect(
      createInvite({
        orgId: org.id,
        email: member.email,
        role: "builder",
        createdBy: owner.id,
      }),
    ).rejects.toMatchObject({ code: "ALREADY_MEMBER" });
  });

  it("forbids viewer from create and revoke", async () => {
    const { owner, org } = await setupOwnerOrg();
    const viewer = await createTestUser();
    userIds.push(viewer.id);
    await createTestMembership({
      orgId: org.id,
      userId: viewer.id,
      role: "viewer",
    });

    await expect(
      createInvite({
        orgId: org.id,
        email: "someone@example.com",
        role: "builder",
        createdBy: viewer.id,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);

    const invite = await createTestInvite({
      orgId: org.id,
      email: "revoke-target@example.com",
      createdBy: owner.id,
    });

    await expect(
      revokeInvite({
        orgId: org.id,
        inviteId: invite.id,
        actorId: viewer.id,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("blocks create when a pending invite already exists", async () => {
    const { owner, org } = await setupOwnerOrg();
    const email = `pending-${crypto.randomUUID().slice(0, 8)}@example.com`;

    await createInvite({
      orgId: org.id,
      email,
      role: "admin",
      createdBy: owner.id,
    });

    await expect(
      createInvite({
        orgId: org.id,
        email,
        role: "builder",
        createdBy: owner.id,
      }),
    ).rejects.toMatchObject({ code: "INVITE_PENDING" });
  });

  it("revoke then accept returns INVITE_INVALID", async () => {
    const { owner, org } = await setupOwnerOrg();
    const invitee = await createTestUser({
      email: `revoked-${crypto.randomUUID().slice(0, 8)}@example.com`,
    });
    userIds.push(invitee.id);

    const invite = await createInvite({
      orgId: org.id,
      email: invitee.email,
      role: "builder",
      createdBy: owner.id,
    });

    await revokeInvite({
      orgId: org.id,
      inviteId: invite.id,
      actorId: owner.id,
    });

    await expect(
      acceptInvite({
        token: invite.token,
        userId: invitee.id,
        userEmail: invitee.email,
      }),
    ).rejects.toMatchObject({ code: "INVITE_INVALID" });
  });

  it("toPublicInvite omits token from client-facing payload", () => {
    const publicInvite = toPublicInvite({
      id: crypto.randomUUID(),
      orgId: crypto.randomUUID(),
      email: "a@example.com",
      role: "builder",
      token: "secret-token-value",
      expiresAt: new Date(),
      acceptedAt: null,
      createdBy: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(publicInvite).not.toHaveProperty("token");
    expect(publicInvite.email).toBe("a@example.com");
  });
});
