import { Module } from '@nestjs/common';
import { SizeGuideController } from './size-guide.controller';
import { SizeGuideService } from './size-guide.service';

@Module({
  controllers: [SizeGuideController],
  providers: [SizeGuideService],
})
export class SizeGuideModule {}
