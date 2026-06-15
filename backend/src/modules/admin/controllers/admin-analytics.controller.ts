import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';
import { AdminAnalyticsService } from '../services/admin-analytics.service';

@Controller('admin/analytics')
@UseGuards(AdminGuard)
export class AdminAnalyticsController {
  constructor(private readonly service: AdminAnalyticsService) {}

  @Get('summary')
  getSummary(@Query() dto: AnalyticsQueryDto) {
    return this.service.getSummary(dto.period);
  }
}
