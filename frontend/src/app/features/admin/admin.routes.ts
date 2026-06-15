import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then((m) => m.DashboardPage) },
  { path: 'products', loadComponent: () => import('./products/admin-products').then((m) => m.AdminProductsPage) },
  { path: 'orders', loadComponent: () => import('./orders/admin-orders').then((m) => m.AdminOrdersPage) },
  { path: 'returns', loadComponent: () => import('./returns/admin-returns').then((m) => m.AdminReturnsPage) },
  { path: 'users', loadComponent: () => import('./users/admin-users').then((m) => m.AdminUsersPage) },
  { path: 'coupons', loadComponent: () => import('./coupons/admin-coupons').then((m) => m.AdminCouponsPage) },
  { path: 'categories', loadComponent: () => import('./categories/admin-categories').then((m) => m.AdminCategoriesPage) },
  { path: 'brands', loadComponent: () => import('./brands/admin-brands').then((m) => m.AdminBrandsPage) },
];
