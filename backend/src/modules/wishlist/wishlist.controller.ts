import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { WishlistService } from './wishlist.service';

@Controller('users/me/wishlist')
export class WishlistController {
  constructor(private readonly service: WishlistService) {}

  @Get()
  findAll(@CurrentUser() user: SupabaseUser) {
    return this.service.findAll(user);
  }

  @Post()
  add(@CurrentUser() user: SupabaseUser, @Body() dto: AddToWishlistDto) {
    return this.service.add(user, dto);
  }

  @Delete(':productId')
  @HttpCode(204)
  remove(
    @CurrentUser() user: SupabaseUser,
    @Param('productId') productId: string,
  ) {
    return this.service.remove(user, productId);
  }
}
