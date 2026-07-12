import { brand } from "@/config/brand";
import type { ReactNode } from "react";

type EmailLayoutProps = {
  preview: string;
  children: ReactNode;
};

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>{preview}</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#f6f7f9",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          color: "#111827",
        }}
      >
        <div style={{ display: "none", maxHeight: 0, overflow: "hidden" }}>
          {preview}
        </div>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ backgroundColor: "#f6f7f9", padding: "32px 16px" }}
        >
          <tbody>
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{
                    maxWidth: 520,
                    backgroundColor: "#ffffff",
                    borderRadius: 8,
                    padding: "32px 28px",
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          paddingBottom: 20,
                        }}
                      >
                        {brand.name}
                      </td>
                    </tr>
                    <tr>
                      <td>{children}</td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          paddingTop: 28,
                          fontSize: 12,
                          color: "#6b7280",
                          lineHeight: 1.5,
                        }}
                      >
                        If you did not request this, you can ignore this email.
                        <br />
                        {brand.legal.company}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
