export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'active' | 'banned' | 'deleted';
export type Gender = 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS';
export type OrderStatus =
  | 'pending_payment' | 'payment_failed' | 'confirmed' | 'processing'
  | 'shipped' | 'delivered' | 'cancelled' | 'return_requested'
  | 'return_approved' | 'refunded';
export type ReturnStatus =
  | 'requested' | 'approved' | 'rejected' | 'completed' | 'refunded';
export type CouponType = 'percentage' | 'fixed';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PagedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface AppUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size: number;
  color: string;
  colorHex: string | null;
  stock: number;
  imageUrls: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: Brand;
  category: Category;
  gender: Gender;
  price: number;
  salePrice: number | null;
  saleEndsAt: string | null;
  thumbnailUrl: string | null;
  averageRating: number | null;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface ProductDetail extends Product {
  description: string;
  variants: ProductVariant[];
  seo: { metaTitle: string | null; metaDescription: string | null; canonicalUrl: string | null } | null;
}

export interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  variant: {
    id: string;
    sku: string;
    size: number;
    color: string;
    stock: number;
    imageUrls: string[];
    product: { id: string; name: string; slug: string; price: number; salePrice: number | null; thumbnailUrl: string | null };
  };
}

export interface Cart {
  id: string;
  items: CartItem[];
  coupon: { code: string; type: CouponType; value: number } | null;
}

export interface OrderItem {
  id: string;
  productName: string;
  productSlug: string;
  variantSku: string;
  size: number;
  color: string;
  thumbnailUrl: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  couponCode: string | null;
  items: OrderItem[];
  tracking: { carrier: string; trackingNumber: string; trackingUrl: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  user: { firstName: string | null; lastName: string | null; avatarUrl: string | null };
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  product: Product;
  addedAt: string;
}

export interface StockNotification {
  id: string;
  variant: {
    id: string;
    sku: string;
    size: number;
    color: string;
    product: { id: string; name: string; slug: string; thumbnailUrl: string | null };
  };
  createdAt: string;
}

export interface Return {
  id: string;
  orderId: string;
  status: ReturnStatus;
  reason: string;
  items: { id: string; quantity: number; orderItem: { productName: string; variantSku: string } }[];
  createdAt: string;
}

export interface Coupon {
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount: number | null;
}

export interface SizeGuideEntry {
  eu: number;
  us: string | null;
  uk: string | null;
  cm: number | null;
}

export interface SizeGuide {
  id: string;
  category: Category | null;
  entries: SizeGuideEntry[];
}

export interface AnalyticsSummary {
  revenue: number;
  orders: number;
  newUsers: number;
  pendingOrders: number;
  pendingReturns: number;
  lowStockVariants: number;
  topProducts: { productSlug: string; unitsSold: number; revenue: number }[];
}

// Admin
export interface AdminProduct extends Product {
  description: string;
  variants: ProductVariant[];
  seo: { metaTitle: string | null; metaDescription: string | null; canonicalUrl: string | null } | null;
  totalStock: number;
  totalSold: number;
  updatedAt: string;
}

export interface AdminOrder extends Order {
  user: { id: string; email: string; firstName: string | null; lastName: string | null };
  shippingAddressSnapshot: unknown;
  stripePaymentIntentId: string | null;
  adminNotes: string | null;
}

export interface AdminUser extends AppUser {
  orderCount: number;
  totalSpent: number;
}

export interface AdminCoupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  isActive: boolean;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
}

export interface AdminReturn extends Return {
  user: { id: string; email: string };
}
