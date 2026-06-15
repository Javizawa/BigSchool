import { Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly service: WebhooksService) {}

  @Post('stripe')
  @HttpCode(200)
  @Public()
  handleStripe(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    return this.service.handleStripeWebhook(rawBody ?? Buffer.alloc(0), signature);
  }
}
