"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InviteMemberDialog } from "@/modules/workspaces/components/invite-member-dialog";
import { MembersTable } from "@/modules/workspaces/components/members-table";
import { PendingInvites } from "@/modules/workspaces/components/pending-invites";
import type { MemberListItem } from "@/modules/workspaces/queries";
import type { toPublicInvite } from "@/modules/workspaces/service";

type PublicInvite = ReturnType<typeof toPublicInvite>;

type MembersSettingsProps = {
  orgId: string;
  orgName: string;
  members: MemberListItem[];
  invites: PublicInvite[];
};

export function MembersSettings({
  orgId,
  orgName,
  members,
  invites,
}: MembersSettingsProps) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleError(message: string) {
    setError(message || null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Members
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage who can access {orgName} and what they can do.
          </p>
        </div>
        <Button type="button" onClick={() => setInviteOpen(true)}>
          Invite member
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">Team</h2>
        <MembersTable orgId={orgId} members={members} onError={handleError} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">Pending invites</h2>
        <PendingInvites
          orgId={orgId}
          invites={invites}
          onError={handleError}
          onInviteClick={() => setInviteOpen(true)}
        />
      </section>

      <InviteMemberDialog
        orgId={orgId}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSuccess={() => {
          setError(null);
          router.refresh();
        }}
      />
    </div>
  );
}
