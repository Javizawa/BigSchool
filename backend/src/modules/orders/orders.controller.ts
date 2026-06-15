import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  findAll(
    @CurrentUser() user: SupabaseUser,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.service.findAll(user, page, limit);
  }

  @Post()
  create(@CurrentUser() user: SupabaseUser, @Body() dto: CreateOrderDto) {
    return this.service.create(user, dto);
  }

  @Get(':orderId')
  findOne(
    @CurrentUser() user: SupabaseUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.service.findOne(user, orderId);
  }

  @Post(':orderId/cancel')
  cancel(
    @CurrentUser() user: SupabaseUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.service.cancel(user, orderId);
  }
}
