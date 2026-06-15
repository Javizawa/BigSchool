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
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { AdminBrandsService } from '../services/admin-brands.service';

@Controller('admin/brands')
@UseGuards(AdminGuard)
export class AdminBrandsController {
  constructor(private readonly service: AdminBrandsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateBrandDto) {
    return this.service.create(dto);
  }

  @Patch(':brandId')
  update(
    @Param('brandId', ParseUUIDPipe) brandId: string,
    @Body() dto: CreateBrandDto,
  ) {
    return this.service.update(brandId, dto);
  }

  @Delete(':brandId')
  @HttpCode(204)
  remove(@Param('brandId', ParseUUIDPipe) brandId: string) {
    return this.service.remove(brandId);
  }
}
