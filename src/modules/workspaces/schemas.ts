import { membershipRoleEnum } from "@/db/schema/org";
import { z } from "zod";

const inviteableRoles = membershipRoleEnum.enumValues.filter(
  (role) => role !== "owner",
) as ["admin", "builder", "viewer"];

export const createInviteSchema = z.object({
  orgId: z.string().uuid(),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .transform((value) => value.toLowerCase()),
  role: z.enum(inviteableRoles),
});

export const revokeInviteSchema = z.object({
  orgId: z.string().uuid(),
  inviteId: z.string().uuid(),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
});

export const updateMemberRoleSchema = z.object({
  orgId: z.string().uuid(),
  membershipId: z.string().uuid(),
  role: z.enum(inviteableRoles),
});

export const removeMemberSchema = z.object({
  orgId: z.string().uuid(),
  membershipId: z.string().uuid(),
});

export const resendInviteSchema = z.object({
  orgId: z.string().uuid(),
  inviteId: z.string().uuid(),
});

/** Client invite form — orgId supplied by the action caller. */
export const inviteMemberFormSchema = createInviteSchema.omit({ orgId: true });

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type RevokeInviteInput = z.infer<typeof revokeInviteSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
export type ResendInviteInput = z.infer<typeof resendInviteSchema>;
export type InviteMemberFormInput = z.infer<typeof inviteMemberFormSchema>;
