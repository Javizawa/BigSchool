import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { CreateCouponDto } from '../dto/create-coupon.dto';
import { UpdateCouponDto } from '../dto/update-coupon.dto';
import { AdminCouponsService } from '../services/admin-coupons.service';

@Controller('admin/coupons')
@UseGuards(AdminGuard)
export class AdminCouponsController {
  constructor(private readonly service: AdminCouponsService) {}

  @Get()
  findAll(@Query('isActive') isActive?: string) {
    const filter =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.service.findAll(filter);
  }

  @Post()
  create(@Body() dto: CreateCouponDto) {
    return this.service.create(dto);
  }

  @Get(':couponId')
  findOne(@Param('couponId', ParseUUIDPipe) couponId: string) {
    return this.service.findOne(couponId);
  }

  @Patch(':couponId')
  update(
    @Param('couponId', ParseUUIDPipe) couponId: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.service.update(couponId, dto);
  }

  @Delete(':couponId')
  @HttpCode(204)
  remove(@Param('couponId', ParseUUIDPipe) couponId: string) {
    return this.service.remove(couponId);
  }
}
