const EMAIL_EXISTS_MESSAGE = "An account with this email already exists";

const DUPLICATE_EMAIL_CODES = new Set([
  "USER_ALREADY_EXISTS",
  "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
  "EMAIL_EXISTS",
]);

type AuthErrorLike = {
  code?: string | null;
  message?: string | null;
  status?: number | null;
};

export function mapAuthError(error: unknown): string {
  const err = (error ?? {}) as AuthErrorLike;
  const code = err.code ?? "";
  const message = (err.message ?? "").toLowerCase();

  if (
    DUPLICATE_EMAIL_CODES.has(code) ||
    message.includes("already exists") ||
    message.includes("user already")
  ) {
    return EMAIL_EXISTS_MESSAGE;
  }

  if (code === "INVALID_EMAIL_OR_PASSWORD" || message.includes("invalid email or password")) {
    return "Invalid email or password";
  }

  if (
    code === "INVALID_TOKEN" ||
    code === "TOKEN_EXPIRED" ||
    message.includes("invalid token") ||
    message.includes("token has expired") ||
    message.includes("expired token")
  ) {
    return "This reset link is invalid or has expired. Request a new one.";
  }

  if (err.message && err.message.trim().length > 0) {
    return err.message;
  }

  return "Something went wrong. Please try again.";
}

export function isDuplicateEmailError(error: unknown): boolean {
  const err = (error ?? {}) as AuthErrorLike;
  const code = err.code ?? "";
  const message = (err.message ?? "").toLowerCase();
  return (
    DUPLICATE_EMAIL_CODES.has(code) ||
    message.includes("already exists") ||
    message.includes("user already")
  );
}

export { EMAIL_EXISTS_MESSAGE };
