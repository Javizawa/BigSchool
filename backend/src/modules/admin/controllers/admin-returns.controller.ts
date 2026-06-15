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
import { ListAdminReturnsDto } from '../dto/list-returns.dto';
import { UpdateReturnDto } from '../dto/update-return.dto';
import { AdminReturnsService } from '../services/admin-returns.service';

@Controller('admin/returns')
@UseGuards(AdminGuard)
export class AdminReturnsController {
  constructor(private readonly service: AdminReturnsService) {}

  @Get()
  findAll(@Query() dto: ListAdminReturnsDto) {
    return this.service.findAll(dto);
  }

  @Get(':returnId')
  findOne(@Param('returnId', ParseUUIDPipe) returnId: string) {
    return this.service.findOne(returnId);
  }

  @Patch(':returnId')
  update(
    @Param('returnId', ParseUUIDPipe) returnId: string,
    @Body() dto: UpdateReturnDto,
  ) {
    return this.service.update(returnId, dto);
  }
}
