import { type Page, expect, test } from "@playwright/test";
import {
  cleanupUserByEmail,
  closeDbPool,
  countUsersByEmail,
  mintVerifyUrl,
  uniqueEmail,
} from "./helpers/auth";

const PASSWORD = "password-ok-12";

async function signUp(
  page: Page,
  input: { name: string; email: string; password: string },
) {
  await page.goto("/signup");
  await page.getByLabel("Name").fill(input.name);
  await page.getByLabel("Email").fill(input.email);
  await page.getByLabel("Password").fill(input.password);

  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/auth/sign-up") &&
      res.request().method() === "POST",
    { timeout: 60_000 },
  );

  await page.getByRole("button", { name: "Create account" }).click();
  const response = await responsePromise;
  expect(
    response.ok(),
    `sign-up failed: ${response.status()} ${await response.text()}`,
  ).toBeTruthy();
  await expect(page).toHaveURL(/\/verify-email/);
}

test.afterAll(async () => {
  await closeDbPool();
});

test.describe("auth", () => {
  test("register → verify → login → dashboard", async ({ page }) => {
    const email = uniqueEmail("happy");
    const name = "E2E Happy";

    try {
      await signUp(page, { name, email, password: PASSWORD });

      await page.goto(await mintVerifyUrl(email, "/dashboard"));
      await expect(page).toHaveURL(/\/dashboard/);

      await page.getByRole("button", { name: "Log out" }).click();
      await expect(page).toHaveURL(/\/login/);

      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(PASSWORD);
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
      await expect(
        page.getByText("Dashboard — build via feature specs."),
      ).toBeVisible();
    } finally {
      await cleanupUserByEmail(email);
    }
  });

  test("duplicate signup → synthetic success, no second user", async ({
    page,
  }) => {
    const email = uniqueEmail("dup");
    const name = "E2E Dup";

    try {
      await signUp(page, { name, email, password: PASSWORD });
      expect(await countUsersByEmail(email)).toBe(1);

      await signUp(page, {
        name: "Another Name",
        email,
        password: PASSWORD,
      });
      expect(await countUsersByEmail(email)).toBe(1);
    } finally {
      await cleanupUserByEmail(email);
    }
  });
});
