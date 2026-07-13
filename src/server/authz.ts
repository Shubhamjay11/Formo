import { db, withOrg } from "@/db";
import {
  memberships,
  type MembershipRole,
} from "@/db/schema/org";
import { and, eq } from "drizzle-orm";

const ROLE_RANK: Record<MembershipRole, number> = {
  viewer: 1,
  builder: 2,
  admin: 3,
  owner: 4,
};

export class AuthorizationError extends Error {
  readonly code = "FORBIDDEN" as const;

  constructor(message = "Insufficient permissions") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function roleAtLeast(
  role: MembershipRole,
  minRole: MembershipRole,
): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

export async function requireRole(
  orgId: string,
  userId: string,
  minRole: MembershipRole,
): Promise<{ role: MembershipRole }> {
  const [membership] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(
      and(withOrg(memberships.orgId, orgId), eq(memberships.userId, userId)),
    )
    .limit(1);

  if (!membership || !roleAtLeast(membership.role, minRole)) {
    throw new AuthorizationError();
  }

  return { role: membership.role };
}
