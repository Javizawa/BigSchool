import { Controller } from '@nestjs/common';
import { SizeGuideService } from './size-guide.service';

@Controller('size-guide')
export class SizeGuideController {
  constructor(private readonly sizeGuideService: SizeGuideService) {}
}
