import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @Public()
  findAll() {
    return this.service.findAll();
  }

  @Get(':categoryId')
  @Public()
  findOne(@Param('categoryId') id: string) {
    return this.service.findOne(id);
  }
}
