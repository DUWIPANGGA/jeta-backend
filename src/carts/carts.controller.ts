// src/carts/carts.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CartsService } from './carts.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';
import { LogActivity } from 'src/common/decorator/activity-log/activity-log.decorator';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@Controller('carts')
@UseGuards(JwtAuthGuard, AccessGuard)
export class CartsController {
  constructor(private readonly cartsService: CartsService) { }

  @Post()
  @Access('Carts', 'create')
  @LogActivity('cart', 'create')
  create(@Request() req, @Body() createDto: CreateCartDto) {
    const userId = req.user.id;
    return this.cartsService.create(userId, createDto);
  }

  @Get()
  @Access('Carts', 'read')
  findAll(@Request() req) {
    const userId = req.user.id;
    return this.cartsService.findAll(userId);
  }

  @Get(':id')
  @Access('Carts', 'read')
  findOne(@Request() req, @Param('id') id: string) {
    const userId = req.user.id;
    return this.cartsService.findOne(userId, +id);
  }

  @Patch(':id')
  @Access('Carts', 'update')
  @LogActivity('cart', 'update')
  update(@Request() req, @Param('id') id: string, @Body() updateDto: UpdateCartDto) {
    const userId = req.user.id;
    return this.cartsService.update(userId, +id, updateDto);
  }

  @Delete(':id')
  @Access('Carts', 'delete')
  @LogActivity('cart', 'delete')
  remove(@Request() req, @Param('id') id: string) {
    const userId = req.user.id;
    return this.cartsService.remove(userId, +id);
  }
}