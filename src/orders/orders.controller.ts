// src/orders/orders.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, AccessGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  @Access('Orders', 'create')
  create(@Body() createDto: any) {
    return this.ordersService.create(createDto);
  }

  @Get()
  @Access('Orders', 'read')
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string, @Request() req) {
    const loggedInUserId = req.user.id;
    const loggedInUserRoleId = req.user.role_id;
    return this.ordersService.findByUser(+userId, loggedInUserId, loggedInUserRoleId);
  }

  @Get(':id')
  @Access('Orders', 'read')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Patch(':id')
  @Access('Orders', 'update')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.ordersService.update(+id, updateDto);
  }

  @Post(':id/tracking')
  @Access('Orders', 'update')
  updateTracking(@Param('id') id: string, @Body('stage_name') stageName: string) {
    return this.ordersService.updateTracking(+id, stageName);
  }

  @Delete(':id')
  @Access('Orders', 'delete')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }
}