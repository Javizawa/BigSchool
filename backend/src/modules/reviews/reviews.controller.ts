import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Post('products/:productId/reviews')
  create(
    @CurrentUser() user: SupabaseUser,
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.service.create(user, productId, dto);
  }

  @Patch('reviews/:reviewId')
  update(
    @CurrentUser() user: SupabaseUser,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.service.update(user, reviewId, dto);
  }

  @Delete('reviews/:reviewId')
  @HttpCode(204)
  remove(
    @CurrentUser() user: SupabaseUser,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
  ) {
    return this.service.remove(user, reviewId);
  }
}
