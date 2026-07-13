import { z } from "zod";

const email = z.string().email("Enter a valid email address");
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  email,
  password,
});

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const resendVerificationSchema = z.object({
  email,
});

/** Relative path only — rejects open redirects (`//`, schemes, hosts). */
export const safeRelativePathSchema = z
  .string()
  .min(1)
  .refine(
    (value) =>
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !value.includes("://") &&
      !value.includes("\\"),
    { message: "Invalid return path" },
  );

export const authReturnSearchParamsSchema = z.object({
  next: safeRelativePathSchema.optional(),
  email: z.string().email().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type SafeRelativePath = z.infer<typeof safeRelativePathSchema>;
export type AuthReturnSearchParams = z.infer<
  typeof authReturnSearchParamsSchema
>;

/** Coerce Next.js searchParams then Zod-validate at the page boundary. */
export function parseAuthReturnSearchParams(
  params: Record<string, string | string[] | undefined>,
): AuthReturnSearchParams {
  const nextRaw = params.next;
  const emailRaw = params.email;
  const next = Array.isArray(nextRaw) ? nextRaw[0] : nextRaw;
  const email = Array.isArray(emailRaw) ? emailRaw[0] : emailRaw;
  const parsed = authReturnSearchParamsSchema.safeParse({
    ...(next ? { next } : {}),
    ...(email ? { email } : {}),
  });
  return parsed.success ? parsed.data : {};
}
