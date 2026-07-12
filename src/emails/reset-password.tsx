import { brand } from "@/config/brand";
import { EmailLayout } from "@/emails/layout";

type ResetPasswordProps = {
  url: string;
  name: string;
};

export function ResetPasswordEmail({ url, name }: ResetPasswordProps) {
  return (
    <EmailLayout preview={`Reset your ${brand.name} password`}>
      <p style={{ margin: "0 0 16px", fontSize: 16, lineHeight: 1.5 }}>
        Hi {name},
      </p>
      <p style={{ margin: "0 0 24px", fontSize: 16, lineHeight: 1.5 }}>
        We received a request to reset your {brand.name} password. Use the
        button below to choose a new one.
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
        Reset password
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
