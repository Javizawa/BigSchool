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
import { ListAdminOrdersDto } from '../dto/list-orders.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { AdminOrdersService } from '../services/admin-orders.service';

@Controller('admin/orders')
@UseGuards(AdminGuard)
export class AdminOrdersController {
  constructor(private readonly service: AdminOrdersService) {}

  @Get()
  findAll(@Query() dto: ListAdminOrdersDto) {
    return this.service.findAll(dto);
  }

  @Get(':orderId')
  findOne(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.service.findOne(orderId);
  }

  @Patch(':orderId')
  update(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.service.update(orderId, dto);
  }
}
