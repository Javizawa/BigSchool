import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AddressDto } from './dto/address.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: SupabaseUser) {
    return this.service.findMe(user);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: SupabaseUser, @Body() dto: UpdateUserDto) {
    return this.service.updateMe(user, dto);
  }

  @Get('me/addresses')
  listAddresses(@CurrentUser() user: SupabaseUser) {
    return this.service.listAddresses(user);
  }

  @Post('me/addresses')
  createAddress(@CurrentUser() user: SupabaseUser, @Body() dto: AddressDto) {
    return this.service.createAddress(user, dto);
  }

  @Patch('me/addresses/:addressId')
  updateAddress(
    @CurrentUser() user: SupabaseUser,
    @Param('addressId') addressId: string,
    @Body() dto: AddressDto,
  ) {
    return this.service.updateAddress(user, addressId, dto);
  }

  @Delete('me/addresses/:addressId')
  @HttpCode(204)
  deleteAddress(
    @CurrentUser() user: SupabaseUser,
    @Param('addressId') addressId: string,
  ) {
    return this.service.deleteAddress(user, addressId);
  }

  @Get('me/stock-notifications')
  listStockNotifications(@CurrentUser() user: SupabaseUser) {
    return this.service.listStockNotifications(user);
  }
}
