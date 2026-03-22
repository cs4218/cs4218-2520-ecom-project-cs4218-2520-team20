// Wang Zhi Wren, A0255368U
import { test } from "./seed-db"
import { expect } from "@playwright/test";

test('Verify update profile can be performed successfully', async ({ reset_db, page }) => {
  await page.goto('http://localhost:3000/login');

  await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('user@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('user123');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  await page.getByRole('button', { name: 'Test User' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page).toHaveURL(/\/dashboard\/user$/, { timeout: 10_000 });
  await page.getByRole('link', { name: 'Profile' }).click();
  await expect(page).toHaveURL(/\/dashboard\/user\/profile$/, { timeout: 10_000 });
  await expect(page.getByRole('textbox', { name: 'Enter Your Name' })).toHaveValue('Test User');
  await expect(page.getByRole('textbox', { name: 'Enter Your Email' })).toHaveValue('user@test.com');
  await expect(page.getByRole('textbox', { name: 'Enter Your Password' })).toBeEmpty();
  await expect(page.getByRole('textbox', { name: 'Enter Your Phone' })).toHaveValue('00000000');
  await expect(page.getByRole('textbox', { name: 'Enter Your Address' })).toHaveValue('Test Address');

  await page.getByRole('textbox', { name: 'Enter Your Name' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('Frozen Treat');
  await page.getByRole('textbox', { name: 'Enter Your Phone' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('45678912');
  await page.getByRole('textbox', { name: 'Enter Your Address' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('Somewhere in Spain');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('abc123');
  await page.getByRole('button', { name: 'UPDATE' }).click();
  await expect(page.getByText('Profile Updated Successfully')).toBeVisible();

  await page.getByRole('button', { name: 'Frozen Treat' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page).toHaveURL(/\/dashboard\/user$/, { timeout: 10_000 });
  await expect(page.getByRole('heading', { name: 'Frozen Treat' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'user@test.com' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '45678912' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Somewhere in Spain' })).toBeVisible();

  await page.getByRole('button', { name: 'Frozen Treat' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();

  await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('user@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('abc123');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await expect(page.getByRole('button', { name: 'Frozen Treat' })).toBeVisible();
  await page.getByRole('button', { name: 'Frozen Treat' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
});

test('Verify that a password update cannot happen if password length is too small', async ({ reset_db, page }) => {
  await page.goto('http://localhost:3000/login');

  await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('user@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('user123');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  await page.getByRole('button', { name: 'Test User' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page).toHaveURL(/\/dashboard\/user$/, { timeout: 10_000 });
  await page.getByRole('link', { name: 'Profile' }).click();
  await expect(page).toHaveURL(/\/dashboard\/user\/profile$/, { timeout: 10_000 });

  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('abc12');
  await page.getByRole('button', { name: 'UPDATE' }).click();
  await expect(page.getByText('Something went wrong')).toBeVisible();

  await page.getByRole('button', { name: 'Test User' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('user@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('abc12');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await expect(page.getByText('Something went wrong')).toBeVisible();
})

test('Cleanup DB', async ({ reset_db }) => {})