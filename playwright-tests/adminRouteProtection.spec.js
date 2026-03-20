// Seah Minlong, A0271643E

import { test, expect } from "@playwright/test";

const USER_EMAIL = process.env.USER_EMAIL ?? "user@test.com";
const USER_PASSWORD = process.env.USER_PASSWORD ?? "user123";

test("unauthenticated user is redirected away from admin dashboard", async ({
  page,
}) => {
  await page.goto("/dashboard/admin");

  await page.waitForURL((url) => !url.toString().includes("/dashboard/admin"), {
    timeout: 10_000,
  });

  await expect(page).not.toHaveURL(/\/dashboard\/admin/);
});

test("logged-in non-admin user is redirected away from admin dashboard", async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill("#exampleInputEmail1", USER_EMAIL);
  await page.fill("#exampleInputPassword1", USER_PASSWORD);
  await page.getByRole("button", { name: "LOGIN" }).click();
  await page.waitForURL((url) => !url.toString().includes("/login"), {
    timeout: 10_000,
  });

  await page.goto("/dashboard/admin");

  await page.waitForURL((url) => !url.toString().includes("/dashboard/admin"), {
    timeout: 10_000,
  });

  await expect(page).not.toHaveURL(/\/dashboard\/admin/);
});
