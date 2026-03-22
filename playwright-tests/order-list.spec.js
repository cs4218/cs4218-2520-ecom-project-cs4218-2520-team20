// Wang Zhi Wren, A0255368U
import "dotenv/config";
import { test } from "./seed-db"
import { expect } from "@playwright/test";
import productModel from "../models/productModel";
import mongoose from "mongoose";
import categoryModel from "../models/categoryModel";

const braintree_test_card_mastercard = '5555 5555 5555 4444'

test('Verify orders page updates properly on success', async ({ reset_db, page }) => {
  test.slow()
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('user@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('user123');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  
  await page.getByRole('button', { name: 'Test User' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Orders' }).click();

  await expect(page.getByText('Seed Product')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Not Processed' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Success' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '1' }).nth(1)).toBeVisible();

  await page.getByRole('link', { name: 'Home' }).click();
  await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
  await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
  await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
  await page.getByRole('link', { name: 'Cart' }).click();
  await page.getByRole('button', { name: 'Paying with Card' }).click();

  await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole('textbox', { name: 'Credit Card Number' }).click();
  await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole('textbox', { name: 'Credit Card Number' }).fill(braintree_test_card_mastercard);
  await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole('textbox', { name: 'Expiration Date' }).click();
  await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole('textbox', { name: 'Expiration Date' }).fill('0130');
  await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole('textbox', { name: 'CVV' }).click();
  await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole('textbox', { name: 'CVV' }).fill('132');
  await page.getByRole('button', { name: 'Make Payment' }).click();
  await expect(page).toHaveURL(/\/dashboard\/user\/orders$/, { timeout: 10_000 });

  await expect(page.getByText('Seed ProductA seeded product for testingPrice : 25Seed ProductA seeded product')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Success' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Success' }).nth(1)).toBeVisible();

  await page.getByRole('button', { name: 'Test User' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
});

test('Verify orders page updates properly for a failed order', async ({ reset_db, page }) => {
  test.setTimeout(30000)
  const ui_mongo_db = `${process.env.MONGO_URL.replace(/\/$/, '')}/ui`;
  await mongoose.connect(ui_mongo_db);
  const category = await categoryModel.findOne({ name: 'Seed Category' })
  const product = await productModel.create({
    name: "Bad Product",
    slug: "bad-product",
    description: "A product made specifically to fail the payment - just buy 1!",
    price: 2000,
    category: category._id,
    quantity: 5,
    shipping: true,
  });
  await product.save();
  await mongoose.disconnect();

  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('user@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('user123');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  
  await page.getByRole('button', { name: 'Test User' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Orders' }).click();

  await expect(page.getByText('Seed Product')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Not Processed' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Success' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '1' }).nth(1)).toBeVisible();

  await page.goto('http://localhost:3000/product/bad-product');
  await expect(page.getByText('Bad Product')).toBeVisible();
  await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
  await page.getByRole('link', { name: 'Cart' }).click();
  await page.getByRole('button', { name: 'Paying with Card' }).click();

  await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole('textbox', { name: 'Credit Card Number' }).click();
  await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole('textbox', { name: 'Credit Card Number' }).fill(braintree_test_card_mastercard);
  await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole('textbox', { name: 'Expiration Date' }).click();
  await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole('textbox', { name: 'Expiration Date' }).fill('0130');
  await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole('textbox', { name: 'CVV' }).click();
  await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole('textbox', { name: 'CVV' }).fill('132');
  await page.getByRole('button', { name: 'Make Payment' }).click();
  await expect(page).toHaveURL(/\/dashboard\/user\/orders$/, { timeout: 10_000 });

  await expect(page.locator('div').filter({ hasText: /^Bad ProductA bad product for testingPrice : 2000$/ }).nth(1)).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Failed' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Success' })).toBeVisible();

  await page.getByRole('button', { name: 'Test User' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
});

test('Cleanup DB', async ({ reset_db }) => {})