import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly service: CartService) {}

  @Get()
  getCart(@CurrentUser() user: SupabaseUser) {
    return this.service.getCart(user);
  }

  @Delete()
  @HttpCode(204)
  clearCart(@CurrentUser() user: SupabaseUser) {
    return this.service.clearCart(user);
  }

  @Post('items')
  addItem(@CurrentUser() user: SupabaseUser, @Body() dto: AddCartItemDto) {
    return this.service.addItem(user, dto);
  }

  @Patch('items/:itemId')
  updateItem(
    @CurrentUser() user: SupabaseUser,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.service.updateItem(user, itemId, dto);
  }

  @Delete('items/:itemId')
  removeItem(
    @CurrentUser() user: SupabaseUser,
    @Param('itemId') itemId: string,
  ) {
    return this.service.removeItem(user, itemId);
  }
}
