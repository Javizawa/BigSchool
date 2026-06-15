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
import { CreateProductDto, CreateVariantDto } from '../dto/create-product.dto';
import { ListAdminProductsDto } from '../dto/list-products.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { UpdateVariantDto } from '../dto/update-variant.dto';
import { AdminProductsService } from '../services/admin-products.service';

@Controller('admin/products')
@UseGuards(AdminGuard)
export class AdminProductsController {
  constructor(private readonly service: AdminProductsService) {}

  @Get()
  findAll(@Query() dto: ListAdminProductsDto) {
    return this.service.findAll(dto);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Get(':productId')
  findOne(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.service.findOne(productId);
  }

  @Patch(':productId')
  update(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.service.update(productId, dto);
  }

  @Delete(':productId')
  @HttpCode(204)
  remove(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.service.remove(productId);
  }

  @Post(':productId/variants')
  createVariant(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateVariantDto,
  ) {
    return this.service.createVariant(productId, dto);
  }

  @Patch(':productId/variants/:variantId')
  updateVariant(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.service.updateVariant(productId, variantId, dto);
  }

  @Delete(':productId/variants/:variantId')
  @HttpCode(204)
  removeVariant(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ) {
    return this.service.removeVariant(productId, variantId);
  }
}
