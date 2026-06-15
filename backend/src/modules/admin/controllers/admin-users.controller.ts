import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { ListAdminUsersDto } from '../dto/list-users.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AdminUsersService } from '../services/admin-users.service';

@Controller('admin/users')
@UseGuards(AdminGuard)
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  findAll(@Query() dto: ListAdminUsersDto) {
    return this.service.findAll(dto);
  }

  @Get(':userId')
  findOne(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.service.findOne(userId);
  }

  @Patch(':userId')
  update(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.service.update(userId, dto);
  }
}
