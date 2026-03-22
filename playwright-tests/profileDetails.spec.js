// Alexander Setyawan, A0257149W
import { test, expect } from '@playwright/test';

test('category filter works with single selection', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('checkbox', { name: 'Book' }).check();
  
  await expect(page.getByRole('main')).toContainText('Textbook');
  await expect(page.getByRole('main')).toContainText('Novel');
  await expect(page.getByRole('main')).toContainText('The Law of Contract in Singapore');
});

test('category filter works with multiple selection', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('checkbox', { name: 'Clothing' }).check();
  await page.getByRole('checkbox', { name: 'Electronics' }).check();

  await expect(page.getByRole('main')).toContainText('Smartphone');
  await expect(page.getByRole('main')).toContainText('Laptop');
  await expect(page.getByRole('main')).toContainText('NUS T-shirt');
});

test('price filter works if there are results', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('radio', { name: '$0 to' }).check();
  
  await expect(page.locator('div').filter({ hasText: /^Novel\$14\.99A bestselling novel\.\.\.More DetailsADD TO CART$/ }).first()).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Novel');
  await expect(page.getByRole('main')).toContainText('$14.99');
  
  await expect(page.locator('div').filter({ hasText: /^NUS T-shirt\$4\.99Plain NUS T-shirt for sale\.\.\.More DetailsADD TO CART$/ }).first()).toBeVisible();
  await expect(page.getByRole('main')).toContainText('NUS T-shirt');
  await expect(page.getByRole('main')).toContainText('$4.99');
});

test('price filter works if there are no results', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('radio', { name: '$80 to' }).check();
  
  await expect(page.locator('div').filter({ hasText: /^Load more$/ })).toBeVisible();
  await expect(page.getByTestId('load-more-btn')).toContainText('Load more');
});

test('category and price filters work together', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('checkbox', { name: 'Book' }).check();
  await page.getByRole('radio', { name: '$0 to' }).check();

  await expect(page.getByRole('main')).toContainText('Novel');
  await expect(page.getByRole('main')).toContainText('$14.99');
});

test('home -> filter -> product details', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('checkbox', { name: 'Clothing' }).check();
  await page.getByRole('checkbox', { name: 'Electronics' }).check();

  await expect(page.locator('div').filter({ hasText: /^Smartphone\$999\.99A high-end smartphone\.\.\.More DetailsADD TO CART$/ }).first()).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Smartphone');
  await expect(page.locator('div').filter({ hasText: /^Laptop\$1,499\.99A powerful laptop\.\.\.More DetailsADD TO CART$/ }).first()).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Laptop');
  await expect(page.locator('div').filter({ hasText: /^NUS T-shirt\$4\.99Plain NUS T-shirt for sale\.\.\.More DetailsADD TO CART$/ }).first()).toBeVisible();
  await expect(page.getByRole('main')).toContainText('NUS T-shirt');
  
  await page.getByRole('button', { name: 'More Details' }).first().click();
  await expect(page).toHaveURL(/\/product\/nus-tshirt/, { timeout: 10_000 });
  await expect(page.getByTestId('product-name')).toBeVisible();
  await expect(page.getByText('Product DetailsName :')).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Name : NUS T-shirt');
  await expect(page.getByRole('main')).toContainText('Description : Plain NUS T-shirt for sale');
  await expect(page.getByRole('main')).toContainText('Price :$4.99');
  await expect(page.getByRole('main')).toContainText('Category : Clothing');
});

test('home -> categories button -> all categories page -> clothing page -> product details', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByTestId('categories-link').click();
  await page.getByTestId('all-categories-link').click();
  
  await page.getByRole('link', { name: 'Clothing' }).click();
  await expect(page.getByTestId('main-container').locator('div').filter({ hasText: 'NUS T-shirt$4.99Plain NUS T-' }).nth(3)).toBeVisible();
  await expect(page.getByTestId('main-container')).toContainText('NUS T-shirt');
  
  await page.getByTestId('nus-tshirt-button').click();
  await expect(page.getByTestId('product-name')).toBeVisible();
  await expect(page.getByText('Product DetailsName : NUS T-')).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Name : NUS T-shirt');
  await expect(page.getByRole('main')).toContainText('Description : Plain NUS T-shirt for sale');
  await expect(page.getByRole('main')).toContainText('Price :$4.99');
  await expect(page.getByRole('main')).toContainText('Category : Clothing');
});

test('home -> categories button -> book page -> product details', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByTestId('categories-link').click();
  
  await page.getByTestId('book-link').click();
  await expect(page).toHaveURL(/\/category\/book/, { timeout: 10_000 });
  await expect(page.getByRole('heading', { name: 'Category - Book' })).toBeVisible();
  await expect(page.getByTestId('main-container').locator('h4')).toContainText('Category - Book');
  await expect(page.getByRole('heading', { name: 'result found' })).toBeVisible();
  await expect(page.locator('h6')).toContainText('3 result found');
  await expect(page.getByTestId('main-container').locator('div').filter({ hasText: 'Textbook$79.99A comprehensive' }).nth(3)).toBeVisible();
  await expect(page.getByTestId('main-container')).toContainText('Textbook');
  
  await page.getByTestId('textbook-button').click();
  await expect(page).toHaveURL(/\/product\/textbook/, { timeout: 10_000 });
  await expect(page.getByTestId('product-name')).toBeVisible();
  await expect(page.getByText('Product DetailsName :')).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Name : Textbook');
  await expect(page.getByRole('main')).toContainText('Description : A comprehensive textbook');
  await expect(page.getByRole('main')).toContainText('Price :$79.99');
  await expect(page.getByRole('main')).toContainText('Category : Book');
});

test('home -> categories button -> book page -> product details -> related product details', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByTestId('categories-link').click();

  await page.getByTestId('book-link').click();
  await expect(page).toHaveURL(/\/category\/book/, { timeout: 10_000 });
  await expect(page.getByRole('heading', { name: 'Category - Book' })).toBeVisible();
  await expect(page.getByTestId('main-container').locator('h4')).toContainText('Category - Book');
  await expect(page.getByRole('heading', { name: 'result found' })).toBeVisible();
  await expect(page.locator('h6')).toContainText('3 result found');
  await expect(page.getByTestId('main-container').locator('div').filter({ hasText: 'Textbook$79.99A comprehensive' }).nth(3)).toBeVisible();
  await expect(page.getByTestId('main-container')).toContainText('Textbook');

  await page.getByTestId('textbook-button').click();
  await expect(page).toHaveURL(/\/product\/textbook/, { timeout: 10_000 });
  await expect(page.getByTestId('product-name')).toBeVisible();
  await expect(page.getByText('Product DetailsName :')).toBeVisible();
  await expect(page.locator('h1')).toContainText('Product Details');
  await expect(page.getByRole('main')).toContainText('Name : Textbook');
  await expect(page.getByRole('main')).toContainText('Description : A comprehensive textbook');
  await expect(page.getByRole('main')).toContainText('Price :$79.99');
  await expect(page.getByRole('main')).toContainText('Category : Book');

  await expect(page.getByRole('heading', { name: 'Similar Products ➡️' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Similar Products ➡️');
  await expect(page.getByText('Novel$14.99A bestselling novel...More DetailsThe Law of Contract in Singapore$')).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Novel');

  await page.getByRole('button', { name: 'More Details' }).first().click();
  await expect(page).toHaveURL(/\/product\/novel/, { timeout: 10_000 });
  await expect(page.getByTestId('product-name')).toBeVisible();
  await expect(page.getByText('Product DetailsName :')).toBeVisible();
  await expect(page.locator('h1')).toContainText('Product Details');
  await expect(page.getByRole('main')).toContainText('Name : Novel');
  await expect(page.getByRole('main')).toContainText('Description : A bestselling novel');
  await expect(page.getByRole('main')).toContainText('Price :$14.99');
  await expect(page.getByRole('main')).toContainText('Category : Book');
});