"use server";

import { revalidatePath } from "next/cache";
import {
  acceptInviteSchema,
  createInviteSchema,
  removeMemberSchema,
  resendInviteSchema,
  revokeInviteSchema,
  updateMemberRoleSchema,
} from "@/modules/workspaces/schemas";
import {
  acceptInvite,
  AuthorizationError,
  createInvite,
  InviteError,
  MemberError,
  removeMember,
  resendInvite,
  revokeInvite,
  toPublicInvite,
  updateMemberRole,
} from "@/modules/workspaces/service";
import { getSession } from "@/server/session";

type ActionError = {
  error: { code: string; message: string };
};

function mapError(error: unknown): ActionError {
  if (error instanceof InviteError) {
    return { error: { code: error.code, message: error.message } };
  }
  if (error instanceof MemberError) {
    return { error: { code: error.code, message: error.message } };
  }
  if (error instanceof AuthorizationError) {
    return { error: { code: "FORBIDDEN", message: error.message } };
  }
  throw error;
}

export async function createInviteAction(input: unknown) {
  const session = await getSession();
  if (!session) {
    return {
      error: { code: "UNAUTHORIZED", message: "Sign in required" },
    } as const;
  }

  const parsed = createInviteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      },
    } as const;
  }

  try {
    const invite = await createInvite({
      orgId: parsed.data.orgId,
      email: parsed.data.email,
      role: parsed.data.role,
      createdBy: session.user.id,
    });
    revalidatePath("/settings/members");
    return { data: toPublicInvite(invite) } as const;
  } catch (error) {
    return mapError(error);
  }
}

export async function revokeInviteAction(input: unknown) {
  const session = await getSession();
  if (!session) {
    return {
      error: { code: "UNAUTHORIZED", message: "Sign in required" },
    } as const;
  }

  const parsed = revokeInviteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      },
    } as const;
  }

  try {
    await revokeInvite({
      orgId: parsed.data.orgId,
      inviteId: parsed.data.inviteId,
      actorId: session.user.id,
    });
    revalidatePath("/settings/members");
    return { data: { ok: true } } as const;
  } catch (error) {
    return mapError(error);
  }
}

export async function acceptInviteAction(input: unknown) {
  const session = await getSession();
  if (!session) {
    return {
      error: { code: "UNAUTHORIZED", message: "Sign in required" },
    } as const;
  }

  const parsed = acceptInviteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      },
    } as const;
  }

  try {
    const result = await acceptInvite({
      token: parsed.data.token,
      userId: session.user.id,
      userEmail: session.user.email,
    });
    return {
      data: {
        membership: result.membership,
        alreadyMember: result.alreadyMember,
      },
    } as const;
  } catch (error) {
    return mapError(error);
  }
}

export async function updateMemberRoleAction(input: unknown) {
  const session = await getSession();
  if (!session) {
    return {
      error: { code: "UNAUTHORIZED", message: "Sign in required" },
    } as const;
  }

  const parsed = updateMemberRoleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      },
    } as const;
  }

  try {
    const membership = await updateMemberRole({
      orgId: parsed.data.orgId,
      membershipId: parsed.data.membershipId,
      role: parsed.data.role,
      actorId: session.user.id,
    });
    revalidatePath("/settings/members");
    return { data: membership } as const;
  } catch (error) {
    return mapError(error);
  }
}

export async function removeMemberAction(input: unknown) {
  const session = await getSession();
  if (!session) {
    return {
      error: { code: "UNAUTHORIZED", message: "Sign in required" },
    } as const;
  }

  const parsed = removeMemberSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      },
    } as const;
  }

  try {
    await removeMember({
      orgId: parsed.data.orgId,
      membershipId: parsed.data.membershipId,
      actorId: session.user.id,
    });
    revalidatePath("/settings/members");
    return { data: { ok: true } } as const;
  } catch (error) {
    return mapError(error);
  }
}

export async function resendInviteAction(input: unknown) {
  const session = await getSession();
  if (!session) {
    return {
      error: { code: "UNAUTHORIZED", message: "Sign in required" },
    } as const;
  }

  const parsed = resendInviteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      },
    } as const;
  }

  try {
    const invite = await resendInvite({
      orgId: parsed.data.orgId,
      inviteId: parsed.data.inviteId,
      actorId: session.user.id,
    });
    revalidatePath("/settings/members");
    return { data: toPublicInvite(invite) } as const;
  } catch (error) {
    return mapError(error);
  }
}
