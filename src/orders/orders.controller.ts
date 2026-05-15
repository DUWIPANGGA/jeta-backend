// src/orders/orders.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, AccessGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  @Access(16, 'create')
  create(@Body() createDto: any) {
    return this.ordersService.create(createDto);
  }

  @Get()
  @Access(16, 'read')
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @Access(16, 'read')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Patch(':id')
  @Access(16, 'update')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.ordersService.update(+id, updateDto);
  }

  @Post(':id/tracking')
  @Access(16, 'update')
  updateTracking(@Param('id') id: string, @Body('stage_name') stageName: string) {
    return this.ordersService.updateTracking(+id, stageName);
  }

  @Delete(':id')
  @Access(16, 'delete')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }
}