import { db, withOrg } from "@/db";
import { users } from "@/db/schema/auth";
import {
  auditLogs,
  invites,
  memberships,
  organizations,
  type MembershipRole,
} from "@/db/schema/org";
import { logger } from "@/lib/logger";
import { AuthorizationError, requireRole } from "@/server/authz";
import { and, eq, gt, isNull } from "drizzle-orm";
import { randomBytes } from "node:crypto";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type PersonalWorkspaceUser = {
  id: string;
  name: string;
};

export type InviteErrorCode =
  | "INVITE_INVALID"
  | "EMAIL_MISMATCH"
  | "ALREADY_MEMBER"
  | "INVITE_PENDING";

export class InviteError extends Error {
  readonly code: InviteErrorCode;

  constructor(code: InviteErrorCode, message: string) {
    super(message);
    this.name = "InviteError";
    this.code = code;
  }
}

export type InviteRow = typeof invites.$inferSelect;
export type MembershipRow = typeof memberships.$inferSelect;

/** Strip token before returning invite data to the client via actions. */
export function toPublicInvite(invite: InviteRow) {
  const { token: _token, ...publicInvite } = invite;
  return publicInvite;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function writeAudit(
  tx: typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: {
    orgId: string;
    actorId: string;
    action: string;
    target?: string;
    metadata?: Record<string, unknown>;
  },
) {
  await tx.insert(auditLogs).values({
    orgId: input.orgId,
    actorId: input.actorId,
    action: input.action,
    target: input.target,
    metadata: input.metadata ?? {},
  });
}

export async function createPersonalWorkspace(user: PersonalWorkspaceUser) {
  const firstName = user.name.trim().split(/\s+/)[0] || "My";
  const name = `${firstName}'s workspace`;
  const slug = user.id;

  return db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({ name, slug })
      .returning();

    if (!org) {
      throw new Error("Failed to create personal workspace organization");
    }

    await tx.insert(memberships).values({
      orgId: org.id,
      userId: user.id,
      role: "owner",
    });

    await writeAudit(tx, {
      orgId: org.id,
      actorId: user.id,
      action: "org.created",
      target: org.id,
    });

    return org;
  });
}

/**
 * Called from Better Auth user.create.after (post-commit).
 * Org+membership are transactional; on failure we compensate by deleting the user
 * because BA after-hooks cannot participate in the signup SQL transaction.
 */
export async function provisionPersonalWorkspaceOnSignup(
  user: PersonalWorkspaceUser,
) {
  try {
    return await createPersonalWorkspace(user);
  } catch (provisionError) {
    try {
      await db.delete(users).where(eq(users.id, user.id));
    } catch (cleanupError) {
      logger.error("ORPHAN_USER_NO_WORKSPACE", {
        userId: user.id,
        provisionError:
          provisionError instanceof Error
            ? provisionError.message
            : String(provisionError),
        cleanupError:
          cleanupError instanceof Error
            ? cleanupError.message
            : String(cleanupError),
      });
      throw cleanupError;
    }
    throw provisionError;
  }
}

export async function createInvite(input: {
  orgId: string;
  email: string;
  role: Exclude<MembershipRole, "owner">;
  createdBy: string;
}): Promise<InviteRow> {
  await requireRole(input.orgId, input.createdBy, "admin");

  const email = normalizeEmail(input.email);
  const now = new Date();

  const [existingMember] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(
      and(
        withOrg(memberships.orgId, input.orgId),
        eq(users.email, email),
      ),
    )
    .limit(1);

  if (existingMember) {
    throw new InviteError(
      "ALREADY_MEMBER",
      "A member with this email already belongs to the workspace",
    );
  }

  const [pendingInvite] = await db
    .select({ id: invites.id })
    .from(invites)
    .where(
      and(
        withOrg(invites.orgId, input.orgId),
        eq(invites.email, email),
        isNull(invites.acceptedAt),
        gt(invites.expiresAt, now),
      ),
    )
    .limit(1);

  if (pendingInvite) {
    throw new InviteError(
      "INVITE_PENDING",
      "A pending invite already exists for this email",
    );
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + INVITE_TTL_MS);

  return db.transaction(async (tx) => {
    const [invite] = await tx
      .insert(invites)
      .values({
        orgId: input.orgId,
        email,
        role: input.role,
        token,
        expiresAt,
        createdBy: input.createdBy,
      })
      .returning();

    if (!invite) {
      throw new Error("Failed to create invite");
    }

    await writeAudit(tx, {
      orgId: input.orgId,
      actorId: input.createdBy,
      action: "invite.created",
      target: invite.id,
      metadata: { email, role: input.role },
    });

    return invite;
  });
}

export async function revokeInvite(input: {
  orgId: string;
  inviteId: string;
  actorId: string;
}): Promise<void> {
  await requireRole(input.orgId, input.actorId, "admin");

  const deleted = await db
    .delete(invites)
    .where(
      and(
        withOrg(invites.orgId, input.orgId),
        eq(invites.id, input.inviteId),
      ),
    )
    .returning({ id: invites.id });

  if (deleted.length === 0) {
    throw new InviteError("INVITE_INVALID", "Invite not found");
  }
}

export async function acceptInvite(input: {
  token: string;
  userId: string;
  userEmail: string;
}): Promise<{ membership: MembershipRow; alreadyMember: boolean }> {
  // Sole bootstrap exception: resolve orgId via token before withOrg scoping.
  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.token, input.token))
    .limit(1);

  if (!invite) {
    throw new InviteError("INVITE_INVALID", "Invite not found");
  }

  const userEmail = normalizeEmail(input.userEmail);
  if (userEmail !== normalizeEmail(invite.email)) {
    throw new InviteError(
      "EMAIL_MISMATCH",
      "Signed-in email does not match this invite",
    );
  }

  const [existingMembership] = await db
    .select()
    .from(memberships)
    .where(
      and(
        withOrg(memberships.orgId, invite.orgId),
        eq(memberships.userId, input.userId),
      ),
    )
    .limit(1);

  // Idempotent success before expiry: re-accept after expiry still succeeds.
  if (existingMembership) {
    return { membership: existingMembership, alreadyMember: true };
  }

  if (invite.expiresAt.getTime() <= Date.now()) {
    throw new InviteError("INVITE_INVALID", "Invite has expired");
  }

  return db.transaction(async (tx) => {
    const [membership] = await tx
      .insert(memberships)
      .values({
        orgId: invite.orgId,
        userId: input.userId,
        role: invite.role,
      })
      .returning();

    if (!membership) {
      throw new Error("Failed to create membership from invite");
    }

    await tx
      .update(invites)
      .set({ acceptedAt: new Date() })
      .where(
        and(withOrg(invites.orgId, invite.orgId), eq(invites.id, invite.id)),
      );

    await writeAudit(tx, {
      orgId: invite.orgId,
      actorId: input.userId,
      action: "invite.accepted",
      target: invite.id,
      metadata: { email: invite.email, role: invite.role },
    });

    return { membership, alreadyMember: false };
  });
}

export { AuthorizationError };
