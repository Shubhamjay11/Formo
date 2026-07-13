import type { Metadata } from "next";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AcceptInvite } from "@/modules/workspaces/components/accept-invite";
import { getInviteByToken } from "@/modules/workspaces/queries";
import { getSession } from "@/server/session";

export const metadata: Metadata = {
  title: "Accept invitation",
};

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const invite = await getInviteByToken(token);
  const session = await getSession();
  const emailMatches = session
    ? normalizeEmail(session.user.email) ===
      normalizeEmail(invite?.email ?? "")
    : false;
  const expired = invite
    ? invite.expiresAt.getTime() <= Date.now()
    : true;

  if (!invite || (expired && !emailMatches)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invitation unavailable</CardTitle>
          <CardDescription>
            This invite link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              Ask the workspace admin to send a new invitation.
            </AlertDescription>
          </Alert>
          <Link href="/login" className={cn(buttonVariants(), "w-full")}>
            Sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  const returnPath = `/invite/${encodeURIComponent(token)}`;
  const signupHref = `/signup?next=${encodeURIComponent(returnPath)}&email=${encodeURIComponent(invite.email)}`;
  const loginHref = `/login?next=${encodeURIComponent(returnPath)}`;

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Join {invite.orgName}</CardTitle>
          <CardDescription>
            You&apos;ve been invited as {invite.role}. Sign in or create an
            account with {invite.email} to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Link href={loginHref} className={cn(buttonVariants(), "w-full")}>
            Sign in
          </Link>
          <Link
            href={signupHref}
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Create account
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!emailMatches) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wrong account</CardTitle>
          <CardDescription>
            This invite was sent to {invite.email}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              You are signed in as {session.user.email}. Sign out and use the
              invited email address to accept.
            </AlertDescription>
          </Alert>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Go to dashboard
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join {invite.orgName}</CardTitle>
        <CardDescription>
          Accept this invitation to join as {invite.role}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AcceptInvite
          token={token}
          orgName={invite.orgName}
          role={invite.role}
          inviteEmail={invite.email}
        />
      </CardContent>
    </Card>
  );
}
