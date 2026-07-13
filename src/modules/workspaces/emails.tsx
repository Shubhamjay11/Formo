import { brand } from "@/config/brand";
import { EmailLayout } from "@/emails/layout";

type InviteEmailProps = {
  url: string;
  orgName: string;
  role: string;
  inviterName: string;
};

export function InviteEmail({
  url,
  orgName,
  role,
  inviterName,
}: InviteEmailProps) {
  return (
    <EmailLayout preview={`Join ${orgName} on ${brand.name}`}>
      <p style={{ margin: "0 0 16px", fontSize: 16, lineHeight: 1.5 }}>
        Hi,
      </p>
      <p style={{ margin: "0 0 24px", fontSize: 16, lineHeight: 1.5 }}>
        {inviterName} invited you to join <strong>{orgName}</strong> on{" "}
        {brand.name} as a <strong>{role}</strong>.
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
        Accept invite
      </a>
      <p
        style={{
          margin: "24px 0 0",
          fontSize: 13,
          lineHeight: 1.5,
          color: "#6b7280",
        }}
      >
        This link expires in 7 days.
      </p>
      <p
        style={{
          margin: "16px 0 0",
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
