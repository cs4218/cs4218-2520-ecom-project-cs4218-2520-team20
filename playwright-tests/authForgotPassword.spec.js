import { test, expect } from '@playwright/test';

// Nigel Lee, A0259264W
test.describe('Auth Protected Routes Flow', () => {
  const testUser = {
    name: process.env.USER_NAME ?? 'Test User',
    email: process.env.USER_EMAIL ?? 'user@test.com',
    password: process.env.USER_PASSWORD ?? 'user123',
  };

  test('Unauthenticated user is redirected to homepage when accessing dashboard', async ({ page }) => {
    await page.goto('/dashboard/user');
    await page.waitForTimeout(3500);
    await expect(page).toHaveURL('/');
  });

  test('Authenticated user can access their private dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Enter Your Email').fill(testUser.email);
    await page.getByPlaceholder('Enter Your Password').fill(testUser.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page).toHaveURL('/');
    await page.goto('/dashboard/user');
    await expect(page).toHaveURL('/dashboard/user');
    await expect(page.getByRole('heading', { name: testUser.name })).toBeVisible();
  });

  test('Regular user is blocked from accessing admin dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Enter Your Email').fill(testUser.email);
    await page.getByPlaceholder('Enter Your Password').fill(testUser.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page).toHaveURL('/');
    await page.goto('/dashboard/admin');
    await page.waitForTimeout(3500);
    await expect(page).toHaveURL('/login');
  });
});