// A0252791Y, Kaw Jun Rei Dylan
import { test, expect } from "@playwright/test";

const USER_EMAIL = process.env.USER_EMAIL ?? "user@test.com";
const USER_PASSWORD = process.env.USER_PASSWORD ?? "user123";

async function loginAs(page, email, password) {
  await page.goto("/login");
  await page.fill("#exampleInputEmail1", email);
  await page.fill("#exampleInputPassword1", password);
  await page.getByRole("button", { name: "LOGIN" }).click();
  await page.waitForURL((url) => !url.toString().includes("/login"), {
    timeout: 10_000,
  });
}

async function logout(page) {
  await page.evaluate(() => localStorage.removeItem("auth"));
  await page.goto("/login");
}

test("Adding to cart from home page displays correct item, total and payment", async ({
  page,
}) => {
  await loginAs(page, USER_EMAIL, USER_PASSWORD);
  await page.goto("/");

  await page.getByRole("button", { name: "ADD TO CART" }).nth(1).click();
  await page.getByRole("link", { name: "Cart" }).click();
  await expect(page.getByRole("main")).toContainText("Seed Product");
  await expect(page.getByRole("main")).toContainText("Total : $25.00");
  await expect(
    page.getByRole("button", { name: "Paying with Card" })
  ).toBeVisible();
});

test("Adding to cart from more details displays correct item, total and payment", async ({
  page,
}) => {
  await loginAs(page, USER_EMAIL, USER_PASSWORD);
  await page.goto("/");
  await page.getByRole("button", { name: "More Details" }).first().click();
  await page.getByRole("button", { name: "ADD TO CART" }).click();
  await page.getByRole("link", { name: "Cart" }).click();
  await expect(page.getByRole("main")).toContainText(
    "E2EProduct_1774017361551"
  );
  await expect(page.getByRole("main")).toContainText("Total : $99.00");
  await expect(
    page.getByRole("button", { name: "Paying with Card" })
  ).toBeVisible();
});

test("Adding to cart from different pages is successful", async ({ page }) => {
  await loginAs(page, USER_EMAIL, USER_PASSWORD);
  await page.goto("/");
  await page.getByRole("button", { name: "ADD TO CART" }).first().click();
  await page.getByRole("button", { name: "More Details" }).nth(1).click();
  await page.getByRole("button", { name: "ADD TO CART" }).click();
  await page.getByRole("link", { name: "Cart" }).click();
  await expect(page.getByRole("main")).toContainText(
    "E2EProduct_1774017361551"
  );
  await expect(page.getByRole("main")).toContainText("Seed Product");
  await expect(page.getByRole("main")).toContainText("Total : $124.00");
});

test("Successful payment creates order in order page", async ({ page }) => {
  await loginAs(page, USER_EMAIL, USER_PASSWORD);
  await page.goto("/");
  await page.getByRole("button", { name: "ADD TO CART" }).nth(1).click();
  await page.getByRole("link", { name: "Cart" }).click();
  await page.getByRole("button", { name: "Paying with Card" }).click();
  await page
    .locator('iframe[name="braintree-hosted-field-number"]')
    .contentFrame()
    .getByRole("textbox", { name: "Credit Card Number" })
    .click();
  await page
    .locator('iframe[name="braintree-hosted-field-number"]')
    .contentFrame()
    .getByRole("textbox", { name: "Credit Card Number" })
    .fill("4111 1111 1111 1111");
  await page
    .locator('iframe[name="braintree-hosted-field-expirationDate"]')
    .contentFrame()
    .getByRole("textbox", { name: "Expiration Date" })
    .click();
  await page
    .locator('iframe[name="braintree-hosted-field-expirationDate"]')
    .contentFrame()
    .getByRole("textbox", { name: "Expiration Date" })
    .fill("1234");
  await page
    .locator('iframe[name="braintree-hosted-field-cvv"]')
    .contentFrame()
    .getByRole("textbox", { name: "CVV" })
    .click();
  await page
    .locator('iframe[name="braintree-hosted-field-cvv"]')
    .contentFrame()
    .getByRole("textbox", { name: "CVV" })
    .fill("123");
  await page.getByRole("button", { name: "Make Payment" }).click();
  await page.goto("/dashboard/user/orders");
  await expect(page.getByRole("main")).toContainText("Seed Product");
});

test("Removing item from cart updates total", async ({ page }) => {
  await loginAs(page, USER_EMAIL, USER_PASSWORD);
  await page.goto("/");
  await page.getByRole("button", { name: "ADD TO CART" }).first().click();
  await page.getByRole("button", { name: "ADD TO CART" }).nth(1).click();
  await page.getByRole("link", { name: "Cart" }).click();
  await expect(page.getByRole("main")).toContainText("Total : $124.00");
  await page.getByRole("button", { name: "Remove" }).first().click();
  await page.getByRole("heading", { name: "Total : $" }).click();
  await expect(page.getByRole("main")).toContainText("Total : $25.00");
});

test("Cart is persistent from logged out to logged in", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "ADD TO CART" }).nth(1).click();
  await page.getByRole("link", { name: "Cart" }).click();
  await expect(page.getByRole("main")).toContainText("Seed Product");
  await expect(page.getByRole("main")).toContainText("Total : $25.00");
  await loginAs(page, USER_EMAIL, USER_PASSWORD);
  await page.getByRole("link", { name: "Cart" }).click();
  await expect(page.getByRole("main")).toContainText("Seed Product");
  await expect(page.getByRole("main")).toContainText("Total : $25.00");
});

test("Cart is persistent from logged in to logged out", async ({ page }) => {
  await loginAs(page, USER_EMAIL, USER_PASSWORD);
  await page.goto("/");
  await page.getByRole("button", { name: "ADD TO CART" }).nth(1).click();
  await page.getByRole("link", { name: "Cart" }).click();
  await expect(page.getByRole("main")).toContainText("Seed Product");
  await expect(page.getByRole("main")).toContainText("Total : $25.00");

  await logout(page);

  await page.getByRole("link", { name: "Cart" }).click();
  await expect(page.getByRole("main")).toContainText("Seed Product");
  await expect(page.getByRole("main")).toContainText("Total : $25.00");
});
