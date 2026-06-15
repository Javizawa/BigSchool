import { Body, Controller, Post } from '@nestjs/common';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post('intent')
  createIntent(
    @CurrentUser() user: SupabaseUser,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    return this.service.createIntent(user, dto);
  }
}
