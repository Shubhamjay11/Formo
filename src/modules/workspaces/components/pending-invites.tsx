"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  resendInviteAction,
  revokeInviteAction,
} from "@/modules/workspaces/actions";
import type { toPublicInvite } from "@/modules/workspaces/service";

type PublicInvite = ReturnType<typeof toPublicInvite>;

type PendingInvitesProps = {
  orgId: string;
  invites: PublicInvite[];
  onError: (message: string) => void;
  onInviteClick: () => void;
};

function formatExpiry(expiresAt: Date | string) {
  const date = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PendingInvites({
  orgId,
  invites,
  onError,
  onInviteClick,
}: PendingInvitesProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleResend(inviteId: string) {
    setPendingId(inviteId);
    onError("");
    const result = await resendInviteAction({ orgId, inviteId });
    setPendingId(null);

    if ("error" in result && result.error) {
      onError(result.error.message);
      return;
    }

    router.refresh();
  }

  async function handleRevoke(inviteId: string) {
    setPendingId(inviteId);
    onError("");
    const result = await revokeInviteAction({ orgId, inviteId });
    setPendingId(null);

    if ("error" in result && result.error) {
      onError(result.error.message);
      return;
    }

    router.refresh();
  }

  if (invites.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          No pending invites — invite a teammate to collaborate.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={onInviteClick}
        >
          Invite member
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="border-b border-border bg-muted/40">
          <tr>
            <th className="px-4 py-2.5 font-medium text-muted-foreground">
              Email
            </th>
            <th className="px-4 py-2.5 font-medium text-muted-foreground">
              Role
            </th>
            <th className="px-4 py-2.5 font-medium text-muted-foreground">
              Expires
            </th>
            <th className="px-4 py-2.5 font-medium text-muted-foreground">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {invites.map((invite) => {
            const isBusy = pendingId === invite.id;

            return (
              <tr
                key={invite.id}
                className="border-b border-border last:border-b-0"
              >
                <td className="px-4 py-3 text-foreground">{invite.email}</td>
                <td className="px-4 py-3 capitalize text-muted-foreground">
                  {invite.role}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatExpiry(invite.expiresAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => void handleResend(invite.id)}
                    >
                      {isBusy ? "Working…" : "Resend"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => void handleRevoke(invite.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
