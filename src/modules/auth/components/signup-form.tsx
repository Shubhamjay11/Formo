"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { EMAIL_EXISTS_MESSAGE, mapAuthError } from "@/modules/auth/map-auth-error";
import {
  type SafeRelativePath,
  type SignupInput,
  signupSchema,
} from "@/modules/auth/schemas";

type SignupFormProps = {
  callbackUrl?: SafeRelativePath;
  defaultEmail?: string;
};

export function SignupForm({ callbackUrl, defaultEmail }: SignupFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const verificationCallback = callbackUrl ?? "/verify-email";
  const loginHref = callbackUrl
    ? `/login?next=${encodeURIComponent(callbackUrl)}`
    : "/login";
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: defaultEmail ?? "",
      password: "",
    },
  });

  async function onSubmit(values: SignupInput) {
    setFormError(null);
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL: verificationCallback,
    });

    if (error) {
      const message = mapAuthError(error);
      if (message === EMAIL_EXISTS_MESSAGE) {
        setError("email", { message: EMAIL_EXISTS_MESSAGE });
        return;
      }
      setFormError(message);
      return;
    }

    if (callbackUrl) {
      router.push(`/verify-email?next=${encodeURIComponent(callbackUrl)}`);
    } else {
      router.push("/verify-email");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={loginHref}
          className="text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
