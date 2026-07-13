import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MembersSettings } from "@/modules/workspaces/components/members-settings";
import {
  getActiveOrg,
  listInvites,
  listMembers,
} from "@/modules/workspaces/queries";
import { roleAtLeast } from "@/server/authz";
import { requireSession } from "@/server/session";

export default async function MembersSettingsPage() {
  const session = await requireSession();
  const active = await getActiveOrg(session.user.id);

  if (!active) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>No workspace found</CardTitle>
            <CardDescription>
              We could not find a workspace for your account. Try signing out
              and back in, or contact support if this keeps happening.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!roleAtLeast(active.membership.role, "admin")) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>
              You don&apos;t have access to manage members. Ask an owner or
              admin if you need a change.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const [members, invites] = await Promise.all([
    listMembers(active.org.id),
    listInvites(active.org.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <MembersSettings
        orgId={active.org.id}
        orgName={active.org.name}
        members={members}
        invites={invites}
      />
    </div>
  );
}
