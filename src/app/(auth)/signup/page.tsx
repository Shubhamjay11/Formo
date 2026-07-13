import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "@/modules/auth/components/signup-form";
import { parseAuthReturnSearchParams } from "@/modules/auth/schemas";

export const metadata: Metadata = {
  title: "Create account",
};

type SignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const { next, email } = parseAuthReturnSearchParams(params);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Register with email and password to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm callbackUrl={next} defaultEmail={email} />
      </CardContent>
    </Card>
  );
}
