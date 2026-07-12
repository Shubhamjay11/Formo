import { brand } from "@/config/brand";
import { db } from "@/db";
import * as authSchema from "@/db/schema/auth";
import { ResetPasswordEmail } from "@/emails/reset-password";
import { VerifyEmailEmail } from "@/emails/verify-email";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { provisionPersonalWorkspaceOnSignup } from "@/modules/workspaces/service";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { createElement } from "react";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: authSchema,
    transaction: true,
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: `Verify your email for ${brand.name}`,
        react: createElement(VerifyEmailEmail, { url, name: user.name }),
      }).catch((err) => {
        logger.error("EMAIL_SEND_FAILED", { kind: "verify", err });
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: `Reset your ${brand.name} password`,
        react: createElement(ResetPasswordEmail, { url, name: user.name }),
      }).catch((err) => {
        logger.error("EMAIL_SEND_FAILED", { kind: "reset", err });
      });
    },
  },
  advanced: {
    database: { generateId: "uuid" },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await provisionPersonalWorkspaceOnSignup({
            id: user.id,
            name: user.name,
          });
        },
      },
    },
  },
  plugins: [nextCookies()],
});
