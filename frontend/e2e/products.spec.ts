import { test, expect } from '@playwright/test';
import { mockPublicApis, mockProduct, pagedResult } from './fixtures';

test.beforeEach(async ({ page }) => {
  await mockPublicApis(page);
});

test('product listing page renders product cards', async ({ page }) => {
  await page.goto('/products');
  await expect(page.getByText('Air Max 1')).toBeVisible();
  await expect(page.getByText('Air Max 2')).toBeVisible();
  await expect(page.getByText('Air Max 3')).toBeVisible();
});

test('category filter appears in sidebar', async ({ page }) => {
  await page.goto('/products');
  // Options are inside a dropdown — open it first
  await page.locator('aside app-filter-select').nth(1).getByRole('button').first().click();
  await expect(page.getByText('Running')).toBeVisible();
});

test('brand filter appears in sidebar', async ({ page }) => {
  await page.goto('/products');
  // Options are inside a dropdown — open it first
  await page.locator('aside app-filter-select').nth(2).getByRole('button').first().click();
  // Scope within the dropdown to avoid matching brand names in product cards
  await expect(page.locator('aside app-filter-select').nth(2).getByText('Nike')).toBeVisible();
});

test('searching filters products by making a new request', async ({ page }) => {
  // Wait for the initial load to complete before registering the search mock,
  // so the initial request is handled by beforeEach and not captured here.
  await page.goto('/products');
  await expect(page.getByText('Air Max 1')).toBeVisible();

  let lastUrl = '';
  await page.route('**/api/v1/products*', (route) => {
    lastUrl = route.request().url();
    return route.fulfill({
      json: pagedResult([mockProduct('42', { name: 'Air Jordan 42' })]),
    });
  });

  const searchInput = page.getByPlaceholder('Buscar zapatillas...');
  await searchInput.fill('Jordan');
  await searchInput.press('Enter');

  await expect(page.getByText('Air Jordan 42')).toBeVisible();
  expect(lastUrl).toContain('search=Jordan');
});

test('empty state shows no-products message', async ({ page }) => {
  await page.route('**/api/v1/products*', (route) =>
    route.fulfill({ json: pagedResult([]) }),
  );

  await page.goto('/products');
  await expect(page.getByText('No encontramos productos con estos filtros.')).toBeVisible();
});
