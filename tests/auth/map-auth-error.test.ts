import { describe, expect, it } from "vitest";
import {
  EMAIL_EXISTS_MESSAGE,
  isDuplicateEmailError,
  mapAuthError,
} from "@/modules/auth/map-auth-error";
import {
  loginSchema,
  parseAuthReturnSearchParams,
  signupSchema,
} from "@/modules/auth/schemas";

describe("auth schemas", () => {
  it("rejects invalid login email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "x",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid signup payload", () => {
    const result = signupSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "password-ok",
    });
    expect(result.success).toBe(true);
  });
});

describe("authReturnSearchParamsSchema", () => {
  it("accepts a relative next path and email", () => {
    const result = parseAuthReturnSearchParams({
      next: "/invite/abc",
      email: "ada@example.com",
    });
    expect(result).toEqual({
      next: "/invite/abc",
      email: "ada@example.com",
    });
  });

  it("rejects open-redirect next values", () => {
    expect(parseAuthReturnSearchParams({ next: "//evil.com" })).toEqual({});
    expect(
      parseAuthReturnSearchParams({ next: "https://evil.com" }),
    ).toEqual({});
    expect(parseAuthReturnSearchParams({ next: "/\\evil" })).toEqual({});
  });
});

describe("mapAuthError", () => {
  it("maps USER_ALREADY_EXISTS to EMAIL_EXISTS message", () => {
    expect(
      mapAuthError({
        code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
        message: "User already exists. Use another email.",
      }),
    ).toBe(EMAIL_EXISTS_MESSAGE);
    expect(
      isDuplicateEmailError({ code: "USER_ALREADY_EXISTS" }),
    ).toBe(true);
  });
});
