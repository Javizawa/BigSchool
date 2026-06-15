import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateReturnDto } from './dto/create-return.dto';
import { ReturnsService } from './returns.service';

@Controller('orders/:orderId')
export class ReturnsController {
  constructor(private readonly service: ReturnsService) {}

  @Get('return')
  findByOrder(
    @CurrentUser() user: SupabaseUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.service.findByOrder(user, orderId);
  }

  @Post('return')
  create(
    @CurrentUser() user: SupabaseUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: CreateReturnDto,
  ) {
    return this.service.create(user, orderId, dto);
  }
}
