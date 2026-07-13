import { db, withOrg } from "@/db";
import { users } from "@/db/schema/auth";
import {
  invites,
  memberships,
  organizations,
  type MembershipRole,
} from "@/db/schema/org";
import { toPublicInvite } from "@/modules/workspaces/service";
import { and, asc, eq, gt, isNull } from "drizzle-orm";

const ROLE_RANK: Record<MembershipRole, number> = {
  owner: 0,
  admin: 1,
  builder: 2,
  viewer: 3,
};

export type ActiveOrg = {
  org: typeof organizations.$inferSelect;
  membership: typeof memberships.$inferSelect;
};

export type MemberListItem = {
  id: string;
  orgId: string;
  userId: string;
  role: MembershipRole;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  email: string;
};

/** First membership by createdAt — active workspace until a switcher exists. */
export async function getActiveOrg(
  userId: string,
): Promise<ActiveOrg | null> {
  const [row] = await db
    .select({
      org: organizations,
      membership: memberships,
    })
    .from(memberships)
    .innerJoin(organizations, eq(organizations.id, memberships.orgId))
    .where(eq(memberships.userId, userId))
    .orderBy(asc(memberships.createdAt))
    .limit(1);

  return row ?? null;
}

export async function listMembers(orgId: string): Promise<MemberListItem[]> {
  const rows = await db
    .select({
      id: memberships.id,
      orgId: memberships.orgId,
      userId: memberships.userId,
      role: memberships.role,
      createdAt: memberships.createdAt,
      updatedAt: memberships.updatedAt,
      name: users.name,
      email: users.email,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(withOrg(memberships.orgId, orgId));

  return rows.sort((a, b) => {
    const rankDiff = ROLE_RANK[a.role] - ROLE_RANK[b.role];
    if (rankDiff !== 0) {
      return rankDiff;
    }
    return a.name.localeCompare(b.name);
  });
}

export async function listInvites(orgId: string) {
  const now = new Date();
  const rows = await db
    .select()
    .from(invites)
    .where(
      and(
        withOrg(invites.orgId, orgId),
        isNull(invites.acceptedAt),
        gt(invites.expiresAt, now),
      ),
    )
    .orderBy(asc(invites.createdAt));

  return rows.map(toPublicInvite);
}
