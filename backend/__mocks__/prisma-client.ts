// Jest mock for the generated Prisma client — avoids import.meta ESM issue in CJS test runner.
// Only exports what is used at runtime (enums + PrismaClient base class).
// Type-only imports (Prisma namespace) are erased by tsc and need no runtime value.
export {
  CouponType,
  Gender,
  OrderStatus,
  ReturnStatus,
  UserRole,
  UserStatus,
} from '../generated/prisma/enums';

export class PrismaClient {
  $connect = jest.fn();
  $disconnect = jest.fn();
}

export const Prisma = {
  Decimal: Number,
};
