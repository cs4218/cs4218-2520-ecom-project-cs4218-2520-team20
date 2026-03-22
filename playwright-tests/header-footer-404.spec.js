// Wang Zhi Wren, A0255368U
import { test } from "./seed-db"
import { expect } from "@playwright/test";

test('reset DB', async ({ reset_db }) => {})

test.describe('Header Element', () => {
  test('should accurately change display on a login-logout sequence', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Login' }).click();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Test User' })).not.toBeVisible();

    await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('user@test.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('user123');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    await expect(page.getByRole('link', { name: 'Register' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Test User' })).toBeVisible();

    await page.getByRole('button', { name: 'Test User' }).click();
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();

    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Test User' })).not.toBeVisible();
  })

  test('should reflect items in the cart accurately in the header', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('listitem').filter({ hasText: 'Cart0' })).toBeVisible();
    await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Cart1' })).toBeVisible();
    await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
    await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Cart3' })).toBeVisible();
    await page.getByRole('button', { name: 'ADD TO CART' }).first().click();

    await page.getByRole('link', { name: 'Cart' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Cart4' })).toBeVisible();
    await page.getByRole('button', { name: 'Remove' }).first().click();
    await page.getByRole('button', { name: 'Remove' }).first().click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Cart2' })).toBeVisible();
    await page.getByRole('button', { name: 'Remove' }).first().click();
    await page.getByRole('button', { name: 'Remove' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Cart0' })).toBeVisible();
  });
  
  test('should properly navigate between pages via the header', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('categories-link').click();
    await expect(page.getByTestId('all-categories-link')).toBeVisible();
    await expect(page.getByTestId('seed-category-link')).toBeVisible();

    await page.getByTestId('all-categories-link').click();
    await expect(page).toHaveURL(/\/categories$/, { timeout: 10_000 });

    await page.getByTestId('categories-link').click();
    await page.getByTestId('seed-category-link').click();
    await expect(page).toHaveURL(/\/seed-category$/, { timeout: 10_000 });
    
    await page.getByRole('link', { name: '🛒 Virtual Vault' }).click();
    await expect(page).toHaveURL(/:3000$|:3000\/$/, { timeout: 10_000 });
  });

  test('should search via the header', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('searchbox', { name: 'Search' }).click();
    await page.getByRole('searchbox', { name: 'Search' }).fill('Seed');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Found 1' })).toBeVisible();

    await page.getByRole('searchbox', { name: 'Search' }).click();
    await page.getByRole('searchbox', { name: 'Search' }).fill('Wrong Search');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByRole('heading', { name: 'No Products Found' })).toBeVisible();
  })
})

test.describe('Footer Element', () => {
  test('should bring me to various pages listed on the footer', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(/\/about$/, { timeout: 10_000 });

    await page.getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL(/\/contact$/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'CONTACT US' })).toBeVisible();
    await expect(page.getByText('www.help@ecommerceapp.com')).toBeVisible();
    await expect(page.getByText('012-3456789')).toBeVisible();
    await expect(page.getByText('1800-0000-0000 (toll free)')).toBeVisible();
    
    await page.getByRole('link', { name: 'Privacy Policy' }).click();
    await expect(page).toHaveURL(/\/policy$/, { timeout: 10_000 });
  })
})

test('Routing to an undefined path should send me to 404', async ({ page }) => {
  await page.goto('http://localhost:3000/categoriies');

  await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Oops ! Page Not Found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go Back' })).toBeVisible();

  await page.getByRole('link', { name: 'Go Back' }).click();
  await expect(page).toHaveURL(/:3000$|:3000\/$/, { timeout: 10_000 });
})