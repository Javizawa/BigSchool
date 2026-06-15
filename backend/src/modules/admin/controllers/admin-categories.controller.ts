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
import { CreateCategoryDto } from '../dto/create-category.dto';
import { AdminCategoriesService } from '../services/admin-categories.service';

@Controller('admin/categories')
@UseGuards(AdminGuard)
export class AdminCategoriesController {
  constructor(private readonly service: AdminCategoriesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  @Patch(':categoryId')
  update(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.service.update(categoryId, dto);
  }

  @Delete(':categoryId')
  @HttpCode(204)
  remove(@Param('categoryId', ParseUUIDPipe) categoryId: string) {
    return this.service.remove(categoryId);
  }
}
