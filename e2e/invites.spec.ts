import { type Page, expect, test } from "@playwright/test";
import {
  cleanupUserByEmail,
  closeDbPool,
  findInviteTokenByEmail,
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

async function verifyAndLand(page: Page, email: string, callbackURL: string) {
  await page.goto(await mintVerifyUrl(email, callbackURL));
}

test.afterAll(async () => {
  await closeDbPool();
});

test.describe("invites", () => {
  test("owner invites builder → accept → Access denied on members", async ({
    page,
  }) => {
    const ownerEmail = uniqueEmail("owner");
    const builderEmail = uniqueEmail("builder");

    try {
      await signUp(page, {
        name: "E2E Owner",
        email: ownerEmail,
        password: PASSWORD,
      });
      await verifyAndLand(page, ownerEmail, "/dashboard");
      await expect(page).toHaveURL(/\/dashboard/);

      await page.goto("/settings/members");
      await expect(page.getByRole("heading", { name: "Members" })).toBeVisible();

      await page.getByRole("button", { name: "Invite member" }).first().click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Email").fill(builderEmail);
      await dialog.getByLabel("Role").click();
      await page.getByRole("option", { name: "Builder" }).click();
      await dialog.getByRole("button", { name: "Send invite" }).click();

      await expect(page.getByText(builderEmail)).toBeVisible();
      await expect(page.getByText("builder").first()).toBeVisible();

      const token = await findInviteTokenByEmail(builderEmail);
      expect(token, "invite token should exist in DB").toBeTruthy();

      await page.getByRole("button", { name: "Log out" }).click();
      await expect(page).toHaveURL(/\/login/);

      await signUp(page, {
        name: "E2E Builder",
        email: builderEmail,
        password: PASSWORD,
      });
      await verifyAndLand(page, builderEmail, `/invite/${token}`);
      await expect(page).toHaveURL(new RegExp(`/invite/${token}`));
      await expect(page.getByText(/Join /).first()).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Accept invitation" }),
      ).toBeVisible();

      await page.getByRole("button", { name: "Accept invitation" }).click();
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(
        page.getByText("Dashboard — build via feature specs."),
      ).toBeVisible();

      await page.goto("/settings/members");
      await expect(page.getByText("Access denied")).toBeVisible();
      await expect(
        page.getByText(/You don't have access to manage members/),
      ).toBeVisible();
    } finally {
      await cleanupUserByEmail(builderEmail);
      await cleanupUserByEmail(ownerEmail);
      // Second pass: confirm idempotent / FK-safe when users already gone.
      await cleanupUserByEmail(builderEmail);
      await cleanupUserByEmail(ownerEmail);
    }
  });

  test("email mismatch shows Wrong account", async ({ page }) => {
    const ownerEmail = uniqueEmail("mismatch-owner");
    const inviteEmail = uniqueEmail("mismatch-invite");
    const otherEmail = uniqueEmail("mismatch-other");

    try {
      await signUp(page, {
        name: "Mismatch Owner",
        email: ownerEmail,
        password: PASSWORD,
      });
      await verifyAndLand(page, ownerEmail, "/dashboard");

      await page.goto("/settings/members");
      await page.getByRole("button", { name: "Invite member" }).first().click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Email").fill(inviteEmail);
      await dialog.getByRole("button", { name: "Send invite" }).click();
      await expect(page.getByText(inviteEmail)).toBeVisible();

      const token = await findInviteTokenByEmail(inviteEmail);
      expect(token, "invite token should exist in DB").toBeTruthy();

      await page.getByRole("button", { name: "Log out" }).click();

      await signUp(page, {
        name: "Wrong Account",
        email: otherEmail,
        password: PASSWORD,
      });
      await verifyAndLand(page, otherEmail, "/dashboard");

      await page.goto(`/invite/${token}`);
      await expect(page.getByText("Wrong account")).toBeVisible();
      await expect(
        page.getByText(`This invite was sent to ${inviteEmail}.`),
      ).toBeVisible();
      await expect(
        page.getByText(
          `You are signed in as ${otherEmail}. Sign out and use the invited email address to accept.`,
        ),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Accept invitation" }),
      ).toHaveCount(0);
    } finally {
      await cleanupUserByEmail(otherEmail);
      await cleanupUserByEmail(ownerEmail);
      await cleanupUserByEmail(inviteEmail);
      await cleanupUserByEmail(otherEmail);
      await cleanupUserByEmail(ownerEmail);
    }
  });
});
