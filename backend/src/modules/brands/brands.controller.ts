import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { BrandsService } from './brands.service';

@Controller('brands')
export class BrandsController {
  constructor(private readonly service: BrandsService) {}

  @Get()
  @Public()
  findAll() {
    return this.service.findAll();
  }

  @Get(':brandId')
  @Public()
  findOne(@Param('brandId') id: string) {
    return this.service.findOne(id);
  }
}
