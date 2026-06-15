import type { Page } from '@playwright/test';

export const mockCategory = {
  id: 'cat-1',
  name: 'Running',
  slug: 'running',
  imageUrl: null,
};

export const mockBrand = {
  id: 'brand-1',
  name: 'Nike',
  slug: 'nike',
  logoUrl: null,
};

export function mockProduct(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    name: `Air Max ${id}`,
    slug: `air-max-${id}`,
    price: 120,
    salePrice: null,
    saleEndsAt: null,
    thumbnailUrl: null,
    averageRating: null,
    reviewCount: 0,
    isActive: true,
    gender: 'MEN',
    createdAt: new Date().toISOString(),
    brand: mockBrand,
    category: mockCategory,
    ...overrides,
  };
}

export function pagedResult(items: unknown[], total?: number) {
  return {
    data: items,
    meta: { total: total ?? items.length, page: 1, limit: 24, pages: 1 },
  };
}

export async function mockPublicApis(page: Page) {
  await page.route('**/api/v1/categories', (route) =>
    route.fulfill({ json: [mockCategory] }),
  );
  await page.route('**/api/v1/brands', (route) =>
    route.fulfill({ json: [mockBrand] }),
  );
  await page.route('**/api/v1/products*', (route) =>
    route.fulfill({
      json: pagedResult([mockProduct('1'), mockProduct('2'), mockProduct('3')]),
    }),
  );
}
