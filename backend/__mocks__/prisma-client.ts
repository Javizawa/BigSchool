// Jest manual mock for @prisma/client — keeps tests in CJS without ESM conflicts.
// Enums are inlined so the mock has no dependency on the real @prisma/client.

export enum Gender {
  man = 'man',
  woman = 'woman',
  unisex = 'unisex',
  kids = 'kids',
}

export enum OrderStatus {
  pending_payment = 'pending_payment',
  confirmed = 'confirmed',
  processing = 'processing',
  shipped = 'shipped',
  delivered = 'delivered',
  cancelled = 'cancelled',
  payment_failed = 'payment_failed',
  return_requested = 'return_requested',
  return_approved = 'return_approved',
  refunded = 'refunded',
}

export enum ReturnStatus {
  requested = 'requested',
  approved = 'approved',
  rejected = 'rejected',
  completed = 'completed',
  refunded = 'refunded',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  active = 'active',
  suspended = 'suspended',
}

export enum CouponType {
  percentage = 'percentage',
  fixed_amount = 'fixed_amount',
}

export class PrismaClient {
  $connect = jest.fn();
  $disconnect = jest.fn();
}

export const Prisma = {
  Decimal: Number,
};
