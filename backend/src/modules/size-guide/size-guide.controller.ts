import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { SizeGuideService } from './size-guide.service';

@Controller('size-guide')
export class SizeGuideController {
  constructor(private readonly sizeGuideService: SizeGuideService) {}

  @Get()
  @Public()
  findGlobal() {
    return this.sizeGuideService.findGlobal();
  }

  @Get(':categoryId')
  @Public()
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.sizeGuideService.findByCategory(categoryId);
  }
}
