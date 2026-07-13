"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { mapAuthError } from "@/modules/auth/map-auth-error";
import {
  type ResendVerificationInput,
  type SafeRelativePath,
  resendVerificationSchema,
} from "@/modules/auth/schemas";

type VerifyEmailNoticeProps = {
  callbackUrl?: SafeRelativePath;
};

export function VerifyEmailNotice({ callbackUrl }: VerifyEmailNoticeProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const destination = callbackUrl ?? "/dashboard";
  const loginHref = callbackUrl
    ? `/login?next=${encodeURIComponent(callbackUrl)}`
    : "/login";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResendVerificationInput>({
    resolver: zodResolver(resendVerificationSchema),
  });

  async function onSubmit(values: ResendVerificationInput) {
    setFormError(null);
    setSuccess(false);
    const { error } = await authClient.sendVerificationEmail({
      email: values.email,
      callbackURL: destination,
    });

    if (error) {
      setFormError(mapAuthError(error));
      return;
    }

    setSuccess(true);
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Check your email for a verification link. Once verified, you can continue to the app.
        </AlertDescription>
      </Alert>

      {success ? (
        <Alert>
          <AlertDescription>
            If that email is registered, we sent another verification link.
          </AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Resend verification email"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href={loginHref}
          className="text-foreground underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
