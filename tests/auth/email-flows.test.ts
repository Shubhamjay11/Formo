import { db } from "@/db";
import {
  accounts,
  sessions,
  users,
  verifications,
} from "@/db/schema/auth";
import { memberships, organizations } from "@/db/schema/org";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { createEmailVerificationToken } from "better-auth/api";
import { eq, like } from "drizzle-orm";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async () => undefined),
}));

const { auth } = await import("@/lib/auth");

const sendEmailMock = vi.mocked(sendEmail);

type CapturedEmail = {
  to: string;
  subject: string;
  react: ReactElement<{ url: string; name: string }>;
};

function tokenFromUrl(url: string, kind: "verify" | "reset"): string {
  if (kind === "verify") {
    const parsed = new URL(url);
    const token = parsed.searchParams.get("token");
    if (!token) throw new Error(`No token in verify url: ${url}`);
    return token;
  }
  const match = url.match(/\/reset-password\/([^?]+)/);
  if (!match?.[1]) throw new Error(`No token in reset url: ${url}`);
  return match[1];
}

function lastEmailTo(email: string): CapturedEmail {
  const calls = sendEmailMock.mock.calls
    .map((c) => c[0] as CapturedEmail)
    .filter((c) => c.to === email);
  const last = calls.at(-1);
  if (!last) throw new Error(`No email captured for ${email}`);
  return last;
}

async function cleanupUserTree(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
  await db.delete(accounts).where(eq(accounts.userId, userId));
  await db.delete(memberships).where(eq(memberships.userId, userId));
  await db.delete(organizations).where(eq(organizations.slug, userId));
  await db.delete(users).where(eq(users.id, userId));
}

describe("email verification + password reset", () => {
  const createdUserIds: string[] = [];

  beforeEach(() => {
    sendEmailMock.mockClear();
  });

  afterEach(async () => {
    await db
      .delete(verifications)
      .where(like(verifications.identifier, "reset-password:%"));
    for (const id of createdUserIds.splice(0)) {
      await cleanupUserTree(id);
    }
  });

  it("sends verification email on signup and verifies token", async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const email = `verify-${suffix}@example.com`;

    const signedUp = await auth.api.signUpEmail({
      body: {
        name: "Verify User",
        email,
        password: "password-ok-12",
        callbackURL: "/",
      },
    });

    createdUserIds.push(signedUp.user.id);

    expect(sendEmailMock).toHaveBeenCalled();
    const captured = lastEmailTo(email);
    expect(captured.subject).toContain("Verify");

    const token = tokenFromUrl(captured.react.props.url, "verify");

    await auth.api.verifyEmail({
      query: { token },
    });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, signedUp.user.id));
    expect(user?.emailVerified).toBe(true);
  });

  it("rejects an expired verification token", async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const email = `expired-verify-${suffix}@example.com`;

    const signedUp = await auth.api.signUpEmail({
      body: {
        name: "Expired Verify",
        email,
        password: "password-ok-12",
      },
    });
    createdUserIds.push(signedUp.user.id);

    const expiredToken = await createEmailVerificationToken(
      env.BETTER_AUTH_SECRET,
      email,
      undefined,
      -60,
    );

    await expect(
      auth.api.verifyEmail({
        query: { token: expiredToken },
      }),
    ).rejects.toMatchObject({
      status: "UNAUTHORIZED",
    });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, signedUp.user.id));
    expect(user?.emailVerified).toBe(false);
  });

  it("resets password with a valid token then signs in", async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const email = `reset-${suffix}@example.com`;
    const oldPassword = "password-old-12";
    const newPassword = "password-new-12";

    const signedUp = await auth.api.signUpEmail({
      body: {
        name: "Reset User",
        email,
        password: oldPassword,
      },
    });
    createdUserIds.push(signedUp.user.id);

    const verifyCaptured = lastEmailTo(email);
    await auth.api.verifyEmail({
      query: {
        token: tokenFromUrl(verifyCaptured.react.props.url, "verify"),
      },
    });

    sendEmailMock.mockClear();

    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: `${env.BETTER_AUTH_URL}/reset-password`,
      },
      headers: new Headers({
        origin: env.BETTER_AUTH_URL,
      }),
    });

    const resetCaptured = lastEmailTo(email);
    expect(resetCaptured.subject).toContain("Reset");
    const resetToken = tokenFromUrl(resetCaptured.react.props.url, "reset");

    await auth.api.resetPassword({
      body: {
        token: resetToken,
        newPassword,
      },
    });

    const session = await auth.api.signInEmail({
      body: {
        email,
        password: newPassword,
      },
    });
    expect(session.user.email).toBe(email);
  });

  it("rejects an expired password reset token", async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const email = `expired-reset-${suffix}@example.com`;

    const signedUp = await auth.api.signUpEmail({
      body: {
        name: "Expired Reset",
        email,
        password: "password-ok-12",
      },
    });
    createdUserIds.push(signedUp.user.id);

    const verifyCaptured = lastEmailTo(email);
    await auth.api.verifyEmail({
      query: {
        token: tokenFromUrl(verifyCaptured.react.props.url, "verify"),
      },
    });

    sendEmailMock.mockClear();

    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: `${env.BETTER_AUTH_URL}/reset-password`,
      },
      headers: new Headers({
        origin: env.BETTER_AUTH_URL,
      }),
    });

    const resetCaptured = lastEmailTo(email);
    const resetToken = tokenFromUrl(resetCaptured.react.props.url, "reset");

    await db
      .update(verifications)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(eq(verifications.identifier, `reset-password:${resetToken}`));

    await expect(
      auth.api.resetPassword({
        body: {
          token: resetToken,
          newPassword: "password-new-12",
        },
      }),
    ).rejects.toMatchObject({
      status: "BAD_REQUEST",
    });
  });
});
