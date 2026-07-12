import { brand } from "@/config/brand";
import { EmailLayout } from "@/emails/layout";

type VerifyEmailProps = {
  url: string;
  name: string;
};

export function VerifyEmailEmail({ url, name }: VerifyEmailProps) {
  return (
    <EmailLayout preview={`Verify your email for ${brand.name}`}>
      <p style={{ margin: "0 0 16px", fontSize: 16, lineHeight: 1.5 }}>
        Hi {name},
      </p>
      <p style={{ margin: "0 0 24px", fontSize: 16, lineHeight: 1.5 }}>
        Confirm your email address to finish setting up your {brand.name}{" "}
        account.
      </p>
      <a
        href={url}
        style={{
          display: "inline-block",
          backgroundColor: "#111827",
          color: "#ffffff",
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 600,
          padding: "12px 20px",
          borderRadius: 6,
        }}
      >
        Verify email
      </a>
      <p
        style={{
          margin: "24px 0 0",
          fontSize: 13,
          lineHeight: 1.5,
          color: "#6b7280",
          wordBreak: "break-all",
        }}
      >
        Or paste this link into your browser:
        <br />
        {url}
      </p>
    </EmailLayout>
  );
}
