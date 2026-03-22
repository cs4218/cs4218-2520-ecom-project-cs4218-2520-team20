import { test, expect } from '@playwright/test';

// Nigel Lee, A0259264W
test.describe('Auth Registration Flow', () => {

  const testUser = {
    name: `Test User ${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    phone: '1234567890',
    address: '123 Test Street',
    dob: '2000-01-01',
    answer: 'Football'
  };

  test('New user can register successfully and is redirected to login', async ({ page }) => {
    await page.goto('/register');
    
    await page.getByPlaceholder('Enter Your Name').fill(testUser.name);
    await page.getByPlaceholder('Enter Your Email').fill(testUser.email);
    await page.getByPlaceholder('Enter Your Password').fill(testUser.password);
    await page.getByPlaceholder('Enter Your Phone').fill(testUser.phone);
    await page.getByPlaceholder('Enter Your Address').fill(testUser.address);
    await page.locator('#exampleInputDOB1').fill(testUser.dob);
    await page.getByPlaceholder('What is Your Favorite sports').fill(testUser.answer);
    
    await page.getByRole('button', { name: 'REGISTER' }).click();

    await expect(page.getByRole('status')).toContainText(/Successfully/i);
    await expect(page).toHaveURL('/login');
  });

  test('Shows error toast when trying to register with an already existing email', async ({ page }) => {
    await page.goto('/register');

    await page.getByPlaceholder('Enter Your Name').fill(testUser.name);
    await page.getByPlaceholder('Enter Your Email').fill(testUser.email);
    await page.getByPlaceholder('Enter Your Password').fill(testUser.password);
    await page.getByPlaceholder('Enter Your Phone').fill(testUser.phone);
    await page.getByPlaceholder('Enter Your Address').fill(testUser.address);
    await page.locator('#exampleInputDOB1').fill(testUser.dob);
    await page.getByPlaceholder('What is Your Favorite sports').fill(testUser.answer);

    await page.getByRole('button', { name: 'REGISTER' }).click();

    await expect(page.getByRole('status')).toContainText(/Already registered/i);
    await expect(page).toHaveURL('/register');
  });
});