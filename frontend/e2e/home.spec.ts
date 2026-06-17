import { test, expect } from '@playwright/test';
import { mockPublicApis, mockProduct, pagedResult } from './fixtures';

test.beforeEach(async ({ page }) => {
  await mockPublicApis(page);
});

test('hero heading is visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('zapatillas');
});

test('"Ver colección" button links to /products', async ({ page }) => {
  await page.goto('/');
  const link = page.getByRole('link', { name: 'Ver colección' });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/products');
});

test('product cards appear once API responds', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Air Max 1').first()).toBeVisible();
  await expect(page.getByText('Air Max 2').first()).toBeVisible();
});

test('sale product shows SALE badge', async ({ page }) => {
  await page.route('**/api/v1/products*', (route) =>
    route.fulfill({
      json: pagedResult([mockProduct('1', { salePrice: 89 })]),
    }),
  );

  await page.goto('/');
  await expect(page.getByText('SALE').first()).toBeVisible();
});

test('product card links to detail page', async ({ page }) => {
  // Mock the detail endpoint so the ProductDetailPage doesn't redirect on error
  await page.route('**/api/v1/products/1', (route) =>
    route.fulfill({ json: { ...mockProduct('1'), variants: [] } }),
  );
  await page.goto('/');

  await page.getByText('Air Max 1').first().click();
  await expect(page).toHaveURL('/products/1');
});
