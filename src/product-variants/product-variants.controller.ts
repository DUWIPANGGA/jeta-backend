// src/product-variants/product-variants.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProductVariantsService } from './product-variants.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('product-variants')
@UseGuards(JwtAuthGuard, AccessGuard)
export class ProductVariantsController {
  constructor(private readonly productVariantsService: ProductVariantsService) { }

  @Post()
  @Access('ProductVariants', 'create')
  create(@Body() createDto: any) {
    return this.productVariantsService.create(createDto);
  }

  @Get()
  @Access('ProductVariants', 'read')
  findAll() {
    return this.productVariantsService.findAll();
  }

  @Get(':id')
  @Access('ProductVariants', 'read')
  findOne(@Param('id') id: string) {
    return this.productVariantsService.findOne(+id);
  }

  @Patch(':id')
  @Access('ProductVariants', 'update')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.productVariantsService.update(+id, updateDto);
  }

  @Delete(':id')
  @Access('ProductVariants', 'delete')
  remove(@Param('id') id: string) {
    return this.productVariantsService.remove(+id);
  }
}