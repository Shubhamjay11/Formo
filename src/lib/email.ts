import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { ReactElement } from "react";
import { Resend } from "resend";

const resend = new Resend(env.RESEND_API_KEY);

type SendEmailInput = {
  to: string;
  subject: string;
  react: ReactElement;
};

/**
 * Sends via Resend. Logs failures and does not rethrow — callers may
 * fire-and-forget without unhandled rejections.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  try {
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      react: input.react,
    });

    if (error) {
      logger.error("EMAIL_SEND_FAILED", {
        to: input.to,
        subject: input.subject,
        error,
      });
    }
  } catch (err) {
    logger.error("EMAIL_SEND_FAILED", {
      to: input.to,
      subject: input.subject,
      err,
    });
  }
}
