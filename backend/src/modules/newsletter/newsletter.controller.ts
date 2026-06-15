import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { NewsletterDto } from './dto/newsletter.dto';
import { NewsletterService } from './newsletter.service';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly service: NewsletterService) {}

  @Post('subscribe')
  @Public()
  subscribe(@Body() dto: NewsletterDto) {
    return this.service.subscribe(dto);
  }

  @Post('unsubscribe')
  @Public()
  @HttpCode(204)
  unsubscribe(@Body() dto: NewsletterDto) {
    return this.service.unsubscribe(dto);
  }
}
