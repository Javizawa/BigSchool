import {
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ListProductsDto } from './dto/list-products.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  @Public()
  findAll(@Query() dto: ListProductsDto) {
    return this.service.findAll(dto);
  }

  @Get(':productId')
  @Public()
  findOne(@Param('productId') id: string) {
    return this.service.findOne(id);
  }

  @Get(':productId/related')
  @Public()
  findRelated(
    @Param('productId') id: string,
    @Query('limit', new DefaultValuePipe(8), ParseIntPipe) limit: number,
  ) {
    return this.service.findRelated(id, Math.min(limit, 20));
  }

  @Post(':productId/variants/:variantId/notify-stock')
  @HttpCode(201)
  subscribeStockNotification(
    @CurrentUser() user: SupabaseUser,
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.service.subscribeStockNotification(user, productId, variantId);
  }
}
