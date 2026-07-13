"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  removeMemberAction,
  updateMemberRoleAction,
} from "@/modules/workspaces/actions";
import type { MemberListItem } from "@/modules/workspaces/queries";
import type { InviteableRole } from "@/modules/workspaces/service";

const ROLE_OPTIONS: { value: InviteableRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "builder", label: "Builder" },
  { value: "viewer", label: "Viewer" },
];

type MembersTableProps = {
  orgId: string;
  members: MemberListItem[];
  onError: (message: string) => void;
};

export function MembersTable({ orgId, members, onError }: MembersTableProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const ownerCount = members.filter((member) => member.role === "owner").length;

  async function handleRoleChange(
    membershipId: string,
    role: InviteableRole,
  ) {
    setPendingId(membershipId);
    onError("");
    const result = await updateMemberRoleAction({
      orgId,
      membershipId,
      role,
    });
    setPendingId(null);

    if ("error" in result && result.error) {
      onError(result.error.message);
      return;
    }

    router.refresh();
  }

  async function handleRemove(membershipId: string) {
    setPendingId(membershipId);
    onError("");
    const result = await removeMemberAction({
      orgId,
      membershipId,
    });
    setPendingId(null);

    if ("error" in result && result.error) {
      onError(result.error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="border-b border-border bg-muted/40">
          <tr>
            <th className="px-4 py-2.5 font-medium text-muted-foreground">
              Name
            </th>
            <th className="px-4 py-2.5 font-medium text-muted-foreground">
              Email
            </th>
            <th className="px-4 py-2.5 font-medium text-muted-foreground">
              Role
            </th>
            <th className="px-4 py-2.5 font-medium text-muted-foreground">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const isLastOwner = member.role === "owner" && ownerCount <= 1;
            const isBusy = pendingId === member.id;

            return (
              <tr
                key={member.id}
                className="border-b border-border last:border-b-0"
              >
                <td className="px-4 py-3 text-foreground">{member.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {member.email}
                </td>
                <td className="px-4 py-3">
                  {member.role === "owner" ? (
                    <span className="capitalize text-foreground">Owner</span>
                  ) : (
                    <Select
                      value={member.role}
                      disabled={isBusy}
                      onValueChange={(value) => {
                        if (
                          value === "admin" ||
                          value === "builder" ||
                          value === "viewer"
                        ) {
                          void handleRoleChange(member.id, value);
                        }
                      }}
                    >
                      <SelectTrigger
                        size="sm"
                        aria-label={`Role for ${member.name}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isBusy || isLastOwner}
                    onClick={() => void handleRemove(member.id)}
                  >
                    {isBusy ? "Removing…" : "Remove member"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
