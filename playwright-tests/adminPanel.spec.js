// Seah Minlong, A0271643E

import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import os from "os";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@test.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";
const USER_EMAIL = process.env.USER_EMAIL ?? "user@test.com";
const USER_PASSWORD = process.env.USER_PASSWORD ?? "user123";

let TEST_PHOTO_PATH;

test.beforeAll(() => {
  TEST_PHOTO_PATH = path.join(os.tmpdir(), "e2e_test_photo.jpg");
  const minJpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
  ]);
  fs.writeFileSync(TEST_PHOTO_PATH, minJpeg);
});

test.afterAll(() => {
  if (TEST_PHOTO_PATH && fs.existsSync(TEST_PHOTO_PATH)) {
    fs.unlinkSync(TEST_PHOTO_PATH);
  }
});

async function loginAs(page, email, password) {
  await page.goto("/login");
  await page.getByPlaceholder("Enter Your Email").fill(email);
  await page.getByPlaceholder("Enter Your Password").fill(password);
  await page.getByRole("button", { name: "LOGIN" }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });
}

async function logout(page) {
  await page.evaluate(() => localStorage.removeItem("auth"));
  await page.goto("/login");
}

test("created category appears on the public categories page", async ({
  page,
}) => {
  const categoryName = `E2ECategory_${Date.now()}`;

  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

  await page.goto("/dashboard/admin/create-category");
  await page.getByPlaceholder("Enter new category").fill(categoryName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("cell", { name: categoryName })).toBeVisible();

  await logout(page);
  await page.goto("/categories");
  await expect(page.getByRole("link", { name: categoryName })).toBeVisible();
});

test("created product appears on the public product listing page", async ({
  page,
}) => {
  const categoryName = `E2ECategory_${Date.now()}`;
  const productName = `E2EProduct_${Date.now()}`;

  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto("/dashboard/admin/create-category");
  await page.getByPlaceholder("Enter new category").fill(categoryName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("cell", { name: categoryName })).toBeVisible();

  await page.goto("/dashboard/admin/create-product");
  await page.locator(".ant-select-selector").first().click();
  await page.getByTitle(categoryName).click();
  await page.setInputFiles('input[type="file"]', TEST_PHOTO_PATH);
  await page.getByPlaceholder("write a name").fill(productName);
  await page.getByPlaceholder("write a description").fill("An E2E test product description");
  await page.getByPlaceholder("write a Price").fill("99");
  await page.getByPlaceholder("write a quantity").fill("10");
  await page.locator(".ant-select-selector").nth(1).click();
  await page.getByTitle("Yes").click();
  await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
  await expect(page).toHaveURL(/\/admin\/products/, { timeout: 10_000 });

  await logout(page);
  await page.goto("/");
  await expect(page.getByText(productName)).toBeVisible();
});

test("newly created category appears in the Create Product category dropdown", async ({
  page,
}) => {
  const categoryName = `E2ECategory_${Date.now()}`;

  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

  await page.goto("/dashboard/admin/create-category");
  await page.getByPlaceholder("Enter new category").fill(categoryName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("cell", { name: categoryName })).toBeVisible();

  await page.goto("/dashboard/admin/create-product");
  await page.locator(".ant-select-selector").first().click();
  await expect(page.getByTitle(categoryName)).toBeVisible();
});

test("order status changed by admin is reflected on the user orders page", async ({
  page,
}) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto("/dashboard/admin/orders");

  const newStatus = "Shipped";

  const orderBlocks = page.locator(".border.shadow");
  await expect(orderBlocks.first()).toBeVisible();
  const firstOrderSelect = orderBlocks.first().locator(".ant-select").first();
  await firstOrderSelect.click();
  await page.getByTitle(newStatus).click();
  await page.waitForResponse(
    (resp) =>
      resp.url().includes("/api/v1/auth/order-status") &&
      resp.status() === 200,
    { timeout: 10_000 }
  );

  await logout(page);
  await loginAs(page, USER_EMAIL, USER_PASSWORD);
  await page.goto("/dashboard/user/orders");
  await expect(
    page.getByRole("row").nth(1).getByRole("cell").nth(1)
  ).toHaveText(newStatus);
});

test("deleted category no longer appears as a filter option on the homepage", async ({
  page,
}) => {
  const categoryName = `E2ECategory_${Date.now()}`;

  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto("/dashboard/admin/create-category");
  await page.getByPlaceholder("Enter new category").fill(categoryName);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("cell", { name: categoryName })).toBeVisible();

  const row = page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: categoryName }) });
  await row.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("cell", { name: categoryName })).toBeHidden();

  await logout(page);
  await page.goto("/");
  await expect(page.getByText(categoryName)).not.toBeVisible();
});
