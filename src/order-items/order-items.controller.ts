// src/order-items/order-items.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { OrderItemsService } from './order-items.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('order-items')
@UseGuards(JwtAuthGuard, AccessGuard)
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) { }

  @Post()
  @Access('OrderItems', 'create')
  create(@Body() createDto: any) {
    return this.orderItemsService.create(createDto);
  }

  @Get()
  @Access('OrderItems', 'read')
  findAll() {
    return this.orderItemsService.findAll();
  }

  @Get(':id')
  @Access('OrderItems', 'read')
  findOne(@Param('id') id: string) {
    return this.orderItemsService.findOne(+id);
  }

  @Patch(':id')
  @Access('OrderItems', 'update')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.orderItemsService.update(+id, updateDto);
  }

  @Delete(':id')
  @Access('OrderItems', 'delete')
  remove(@Param('id') id: string) {
    return this.orderItemsService.remove(+id);
  }
}