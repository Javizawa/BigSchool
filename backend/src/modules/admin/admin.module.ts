import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AdminAnalyticsController } from './controllers/admin-analytics.controller';
import { AdminBrandsController } from './controllers/admin-brands.controller';
import { AdminCategoriesController } from './controllers/admin-categories.controller';
import { AdminCouponsController } from './controllers/admin-coupons.controller';
import { AdminOrdersController } from './controllers/admin-orders.controller';
import { AdminProductsController } from './controllers/admin-products.controller';
import { AdminReturnsController } from './controllers/admin-returns.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminAnalyticsService } from './services/admin-analytics.service';
import { AdminBrandsService } from './services/admin-brands.service';
import { AdminCategoriesService } from './services/admin-categories.service';
import { AdminCouponsService } from './services/admin-coupons.service';
import { AdminOrdersService } from './services/admin-orders.service';
import { AdminProductsService } from './services/admin-products.service';
import { AdminReturnsService } from './services/admin-returns.service';
import { AdminUsersService } from './services/admin-users.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminProductsController,
    AdminCategoriesController,
    AdminBrandsController,
    AdminOrdersController,
    AdminCouponsController,
    AdminUsersController,
    AdminReturnsController,
    AdminAnalyticsController,
  ],
  providers: [
    AdminProductsService,
    AdminCategoriesService,
    AdminBrandsService,
    AdminOrdersService,
    AdminCouponsService,
    AdminUsersService,
    AdminReturnsService,
    AdminAnalyticsService,
  ],
})
export class AdminModule {}
