import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      { path: '', loadComponent: () => import('./features/home/home').then((m) => m.HomePage) },
      {
        path: 'products',
        loadComponent: () => import('./features/products/product-list/product-list').then((m) => m.ProductListPage),
      },
      {
        path: 'products/:id',
        loadComponent: () => import('./features/products/product-detail/product-detail').then((m) => m.ProductDetailPage),
      },
      {
        path: 'auth/login',
        loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginPage),
      },
      {
        path: 'auth/register',
        loadComponent: () => import('./features/auth/register/register').then((m) => m.RegisterPage),
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/cart/cart-page').then((m) => m.CartPage),
      },
      {
        path: 'checkout',
        canActivate: [authGuard],
        loadComponent: () => import('./features/checkout/checkout').then((m) => m.CheckoutPage),
      },
      {
        path: 'user',
        canActivate: [authGuard],
        loadChildren: () => import('./features/user/user.routes').then((m) => m.userRoutes),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./layouts/admin-layout/admin-layout').then((m) => m.AdminLayout),
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  { path: '**', redirectTo: '' },
];
