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

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type RevokeInviteInput = z.infer<typeof revokeInviteSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
