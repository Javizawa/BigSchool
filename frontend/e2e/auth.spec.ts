import { test, expect } from '@playwright/test';
import { mockPublicApis } from './fixtures';

test.describe('Login page', () => {
  test('renders the login form', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
  });

  test('has a link to the registration page', async ({ page }) => {
    await page.goto('/auth/login');
    const registerLink = page.getByRole('link', { name: 'Regístrate' });
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute('href', '/auth/register');
  });
});

test.describe('Register page', () => {
  test('renders the registration form', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Crear cuenta' })).toBeVisible();
  });
});

test.describe('Protected routes', () => {
  test('redirects /checkout to /auth/login when not authenticated', async ({ page }) => {
    await mockPublicApis(page);
    await page.goto('/checkout');
    await expect(page).toHaveURL('/auth/login');
  });

  test('redirects /user to /auth/login when not authenticated', async ({ page }) => {
    await mockPublicApis(page);
    await page.goto('/user');
    await expect(page).toHaveURL('/auth/login');
  });
});
