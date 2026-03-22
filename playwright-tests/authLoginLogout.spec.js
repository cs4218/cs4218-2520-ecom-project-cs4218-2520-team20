import { test, expect } from '@playwright/test';

// Nigel Lee, A0259264W
test.describe('Auth Login and Logout Flow', () => {
  const testUser = {
    name: process.env.USER_NAME ?? 'Test User',
    email: process.env.USER_EMAIL ?? 'user@test.com',
    password: process.env.USER_PASSWORD ?? 'user123',
  };

  test('User logs in successfully, header updates, and navigates home', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Enter Your Email').fill(testUser.email);
    await page.getByPlaceholder('Enter Your Password').fill(testUser.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page).toHaveURL('/');
    const userDropdown = page.getByRole('button', { name: testUser.name });
    await expect(userDropdown).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).not.toBeVisible();
  });

  test('User sees error toast on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Enter Your Email').fill(testUser.email);
    await page.getByPlaceholder('Enter Your Password').fill('wrong_password');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page.getByRole('status')).toContainText(/Invalid Password/i);
    await expect(page).toHaveURL('/login');
  });

  test('User can log out successfully', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Enter Your Email').fill(testUser.email);
    await page.getByPlaceholder('Enter Your Password').fill(testUser.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page).toHaveURL('/');
    await page.getByRole('button', { name: testUser.name }).click();
    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page.getByRole('status').filter({ hasText: /Logout Successfully/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
    await expect(page.getByRole('button', { name: testUser.name })).not.toBeVisible();
  });
});