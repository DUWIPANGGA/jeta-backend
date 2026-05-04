import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { OrderItemsService } from './order-items.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@UseGuards(JwtAuthGuard)
@Controller('order-items')
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) { }

  @Access(9, 'create')
  @Post()
  create(@Body() createDto: any) {
    return this.orderItemsService.create(createDto);
  }

  @Access(9, 'read')
  @Get()
  findAll() {
    return this.orderItemsService.findAll();
  }

  @Access(9, 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderItemsService.findOne(+id);
  }

  @Access(9, 'update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.orderItemsService.update(+id, updateDto);
  }

  @Access(9, 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderItemsService.remove(+id);
  }
}
