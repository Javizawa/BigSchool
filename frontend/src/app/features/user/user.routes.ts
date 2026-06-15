import { Routes } from '@angular/router';

export const userRoutes: Routes = [
  { path: '', redirectTo: 'profile', pathMatch: 'full' },
  { path: 'profile', loadComponent: () => import('./profile/profile').then((m) => m.ProfilePage) },
  { path: 'orders', loadComponent: () => import('./orders/orders-page').then((m) => m.OrdersPage) },
  { path: 'orders/:id', loadComponent: () => import('./order-detail/order-detail').then((m) => m.OrderDetailPage) },
  { path: 'wishlist', loadComponent: () => import('./wishlist/wishlist').then((m) => m.WishlistPage) },
  { path: 'addresses', loadComponent: () => import('./addresses/addresses').then((m) => m.AddressesPage) },
];
