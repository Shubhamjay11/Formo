import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VerifyEmailNotice } from "@/modules/auth/components/verify-email-notice";
import { parseAuthReturnSearchParams } from "@/modules/auth/schemas";

export const metadata: Metadata = {
  title: "Verify email",
};

type VerifyEmailPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams;
  const { next } = parseAuthReturnSearchParams(params);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          We sent a verification link. You can resend it if you didn&apos;t receive one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <VerifyEmailNotice callbackUrl={next} />
      </CardContent>
    </Card>
  );
}
