// Seah Minlong, A0271643E

import { test, expect } from "@playwright/test";

const USER_EMAIL = process.env.USER_EMAIL ?? "user@test.com";
const USER_PASSWORD = process.env.USER_PASSWORD ?? "user123";

test("unauthenticated user is redirected away from admin dashboard", async ({
  page,
}) => {
  await page.goto("/dashboard/admin");

  await expect(page).not.toHaveURL(/\/dashboard\/admin/, { timeout: 10_000 });
});

test("logged-in non-admin user is redirected away from admin dashboard", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByPlaceholder("Enter Your Email").fill(USER_EMAIL);
  await page.getByPlaceholder("Enter Your Password").fill(USER_PASSWORD);
  await page.getByRole("button", { name: "LOGIN" }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });

  await page.goto("/dashboard/admin");

  await expect(page).not.toHaveURL(/\/dashboard\/admin/, { timeout: 10_000 });
});
