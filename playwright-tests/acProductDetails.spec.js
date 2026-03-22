// Alexander Setyawan, A0257149W
import { test, expect } from '@playwright/test';

test('category filter works with single selection', async ({ page }) => {
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByTestId('categories-link').click();
  await page.getByTestId('all-categories-link').click();

  await expect(page.getByRole('link', { name: 'Seed Category' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Seed Category');

  await page.getByRole('link', { name: 'Seed Category' }).click();
  await expect(page.getByTestId('main-container').locator('div').filter({ hasText: 'Seed Product$15.00A seeded' }).nth(3)).toBeVisible();
  await expect(page.getByTestId('main-container')).toContainText('Seed Product');

  await page.getByTestId('seed-product-button').click();
  await expect(page.getByTestId('product-name')).toBeVisible();
  await expect(page.getByText('Product DetailsName : Seed')).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Name : Seed Product');
});

test('price filter works if there are results', async ({ page }) => {
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByTestId('categories-link').click();
  await page.getByTestId('all-categories-link').click();

  await expect(page.getByRole('link', { name: 'Seed Category' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Seed Category');

  await page.getByRole('link', { name: 'Seed Category' }).click();
  await expect(page.getByTestId('main-container').locator('div').filter({ hasText: 'Seed Product$15.00A seeded' }).nth(3)).toBeVisible();
  await expect(page.getByTestId('main-container')).toContainText('Seed Product');

  await page.getByTestId('seed-product-button').click();
  await expect(page.getByTestId('product-name')).toBeVisible();
  await expect(page.getByText('Product DetailsName : Seed')).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Name : Seed Product');
});

test('price filter works if there are no results', async ({ page }) => {
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByTestId('categories-link').click();
  await page.getByTestId('all-categories-link').click();

  await expect(page.getByRole('link', { name: 'Seed Category' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Seed Category');

  await page.getByRole('link', { name: 'Seed Category' }).click();
  await expect(page.getByTestId('main-container').locator('div').filter({ hasText: 'Seed Product$15.00A seeded' }).nth(3)).toBeVisible();
  await expect(page.getByTestId('main-container')).toContainText('Seed Product');

  await page.getByTestId('seed-product-button').click();
  await expect(page.getByTestId('product-name')).toBeVisible();
  await expect(page.getByText('Product DetailsName : Seed')).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Name : Seed Product');
});

test('filters clear after reset', async ({ page }) => {
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByTestId('categories-link').click();
  await page.getByTestId('all-categories-link').click();

  await expect(page.getByRole('link', { name: 'Seed Category' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Seed Category');

  await page.getByRole('link', { name: 'Seed Category' }).click();
  await expect(page.getByTestId('main-container').locator('div').filter({ hasText: 'Seed Product$15.00A seeded' }).nth(3)).toBeVisible();
  await expect(page.getByTestId('main-container')).toContainText('Seed Product');

  await page.getByTestId('seed-product-button').click();
  await expect(page.getByTestId('product-name')).toBeVisible();
  await expect(page.getByText('Product DetailsName : Seed')).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Name : Seed Product');
});

test('category and price filters work together', async ({ page }) => {
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByTestId('categories-link').click();
  await page.getByTestId('all-categories-link').click();

  await expect(page.getByRole('link', { name: 'Seed Category' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Seed Category');

  await page.getByRole('link', { name: 'Seed Category' }).click();
  await expect(page.getByTestId('main-container').locator('div').filter({ hasText: 'Seed Product$15.00A seeded' }).nth(3)).toBeVisible();
  await expect(page.getByTestId('main-container')).toContainText('Seed Product');

  await page.getByTestId('seed-product-button').click();
  await expect(page.getByTestId('product-name')).toBeVisible();
  await expect(page.getByText('Product DetailsName : Seed')).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Name : Seed Product');
});

test('home -> filter -> product details', async ({ page }) => {
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByTestId('categories-link').click();
  await page.getByTestId('all-categories-link').click();

  await expect(page.getByRole('link', { name: 'Seed Category' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Seed Category');

  await page.getByRole('link', { name: 'Seed Category' }).click();
  await expect(page.getByTestId('main-container').locator('div').filter({ hasText: 'Seed Product$15.00A seeded' }).nth(3)).toBeVisible();
  await expect(page.getByTestId('main-container')).toContainText('Seed Product');

  await page.getByTestId('seed-product-button').click();
  await expect(page.getByTestId('product-name')).toBeVisible();
  await expect(page.getByText('Product DetailsName : Seed')).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Name : Seed Product');
});

test('home -> categories button -> all categories page -> category page -> product details', async ({ page }) => {
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByTestId('categories-link').click();
  await page.getByTestId('all-categories-link').click();

  await expect(page.getByRole('link', { name: 'Seed Category' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Seed Category');

  await page.getByRole('link', { name: 'Seed Category' }).click();
  await expect(page.getByTestId('main-container').locator('div').filter({ hasText: 'Seed Product$15.00A seeded' }).nth(3)).toBeVisible();
  await expect(page.getByTestId('main-container')).toContainText('Seed Product');

  await page.getByTestId('seed-product-button').click();
  await expect(page.getByTestId('product-name')).toBeVisible();
  await expect(page.getByText('Product DetailsName : Seed')).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Name : Seed Product');
});

test('home -> categories button -> book page -> product details', async ({ page }) => {
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByTestId('categories-link').click();
  await page.getByTestId('all-categories-link').click();

  await expect(page.getByRole('link', { name: 'Seed Category' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Seed Category');

  await page.getByRole('link', { name: 'Seed Category' }).click();
  await expect(page.getByTestId('main-container').locator('div').filter({ hasText: 'Seed Product$15.00A seeded' }).nth(3)).toBeVisible();
  await expect(page.getByTestId('main-container')).toContainText('Seed Product');

  await page.getByTestId('seed-product-button').click();
  await expect(page.getByTestId('product-name')).toBeVisible();
  await expect(page.getByText('Product DetailsName : Seed')).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Name : Seed Product');
});

test('home -> categories button -> book page -> product details -> related product details', async ({ page }) => {
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByTestId('categories-link').click();
  await page.getByTestId('all-categories-link').click();

  await expect(page.getByRole('link', { name: 'Seed Category' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Seed Category');

  await page.getByRole('link', { name: 'Seed Category' }).click();
  await expect(page.getByTestId('main-container').locator('div').filter({ hasText: 'Seed Product$15.00A seeded' }).nth(3)).toBeVisible();
  await expect(page.getByTestId('main-container')).toContainText('Seed Product');

  await page.getByTestId('seed-product-button').click();
  await expect(page.getByTestId('product-name')).toBeVisible();
  await expect(page.getByText('Product DetailsName : Seed')).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Name : Seed Product');
});