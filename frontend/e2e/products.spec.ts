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
  await expect(page.getByText('Running')).toBeVisible();
});

test('brand filter appears in sidebar', async ({ page }) => {
  await page.goto('/products');
  await expect(page.getByText('Nike')).toBeVisible();
});

test('searching filters products by making a new request', async ({ page }) => {
  let lastUrl = '';
  await page.route('**/api/v1/products*', (route) => {
    lastUrl = route.request().url();
    return route.fulfill({
      json: pagedResult([mockProduct('42', { name: 'Air Jordan 42' })]),
    });
  });

  await page.goto('/products');
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
