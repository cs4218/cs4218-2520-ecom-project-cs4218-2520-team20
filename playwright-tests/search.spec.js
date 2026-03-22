// Alexander Setyawan, A0257149W
import { test, expect } from '@playwright/test';

test('full match keyword returns search results', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();

  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('textbook');
  await page.getByRole('button', { name: 'Search' }).click();
  
  await expect(page).toHaveURL(/\/search/, { timeout: 10_000 });
  await expect(page.locator('h1')).toContainText('Search Results');
  await expect(page.getByRole('heading', { name: 'Found' })).toBeVisible();
  await expect(page.locator('h6')).toContainText('Found 1');
  await expect(page.locator('h5')).toContainText('Textbook');
});

test('partial match keyword returns search results', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();

  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('vel');
  await page.getByRole('button', { name: 'Search' }).click();
  
  await expect(page).toHaveURL(/\/search/, { timeout: 10_000 });
  await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();
  await expect(page.locator('h1')).toContainText('Search Results');
  await expect(page.getByRole('heading', { name: 'Found' })).toBeVisible();
  await expect(page.locator('h6')).toContainText('Found 1');
  await expect(page.locator('h5')).toContainText('Novel');
});

test('full mismatch keyword returns no results', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();

  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('dpel');
  await page.getByRole('button', { name: 'Search' }).click();
  
  await expect(page).toHaveURL(/\/search/, { timeout: 10_000 });
  await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();
  await expect(page.locator('h1')).toContainText('Search Results');
  await expect(page.getByRole('heading', { name: 'No Products Found' })).toBeVisible();
  await expect(page.locator('h6')).toContainText('No Products Found');
});

test('search results lead to product details', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();

  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('textbook');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page).toHaveURL(/\/search/, { timeout: 10_000 });
  await expect(page.getByText('TextbookA comprehensive')).toBeVisible();
  await expect(page.locator('h5')).toContainText('Textbook');

  await page.getByRole('button', { name: 'More Details' }).click();
  await expect(page).toHaveURL(/\/product\/textbook/, { timeout: 10_000 });
  await expect(page.getByTestId('product-name')).toBeVisible();
  await expect(page.getByText('Product DetailsName :')).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Name : Textbook');
  await expect(page.getByRole('main')).toContainText('Description : A comprehensive textbook');
  await expect(page.getByRole('heading', { name: 'Similar Products ➡️' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Similar Products ➡️');
  await expect(page.getByText('Novel$14.99A bestselling')).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Novel');
});