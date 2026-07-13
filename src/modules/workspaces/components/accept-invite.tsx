"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { acceptInviteAction } from "@/modules/workspaces/actions";

type AcceptInviteProps = {
  token: string;
  orgName: string;
  role: string;
  inviteEmail: string;
};

export function AcceptInvite({
  token,
  orgName,
  role,
  inviteEmail,
}: AcceptInviteProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleAccept() {
    setError(null);
    setPending(true);
    const result = await acceptInviteAction({ token });
    setPending(false);

    if ("error" in result && result.error) {
      setError(result.error.message);
      return;
    }

    if (!("data" in result) || !result.data) {
      setError("Something went wrong. Try again.");
      return;
    }

    if (result.data.alreadyMember) {
      setAlreadyMember(true);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (alreadyMember) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            You are already a member of {orgName}.
          </AlertDescription>
        </Alert>
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            router.push("/dashboard");
          }}
        >
          Go to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Join <span className="font-medium text-foreground">{orgName}</span> as{" "}
        <span className="font-medium text-foreground">{role}</span>. This invite
        was sent to {inviteEmail}.
      </p>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="button"
        className="w-full"
        disabled={pending}
        onClick={handleAccept}
      >
        {pending ? "Accepting…" : "Accept invitation"}
      </Button>
    </div>
  );
}
