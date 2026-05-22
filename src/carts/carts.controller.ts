// src/carts/carts.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CartsService } from './carts.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('carts')
@UseGuards(JwtAuthGuard, AccessGuard)
export class CartsController {
  constructor(private readonly cartsService: CartsService) { }

  @Post()
  @Access('Carts', 'create')
  create(@Body() createDto: any) {
    return this.cartsService.create(createDto);
  }

  @Get()
  @Access('Carts', 'read')
  findAll() {
    return this.cartsService.findAll();
  }

  @Get(':id')
  @Access('Carts', 'read')
  findOne(@Param('id') id: string) {
    return this.cartsService.findOne(+id);
  }

  @Patch(':id')
  @Access('Carts', 'update')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.cartsService.update(+id, updateDto);
  }

  @Delete(':id')
  @Access('Carts', 'delete')
  remove(@Param('id') id: string) {
    return this.cartsService.remove(+id);
  }
}