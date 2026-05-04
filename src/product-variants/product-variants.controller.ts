import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProductVariantsService } from './product-variants.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/common/decorator/roles/roles.decorator';
import { Role } from '@prisma/client';
import { Access } from '../common/decorator/access/access.decorator';


@Controller('product-variants')
export class ProductVariantsController {
  constructor(private readonly productVariantsService: ProductVariantsService) { }

  @UseGuards(JwtAuthGuard)
  @Access(13, 'create')
  @Post()
  create(@Body() createDto: any) {
    return this.productVariantsService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(13, 'read')
  @Get()
  findAll() {
    return this.productVariantsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Access(13, 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productVariantsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Access(13, 'update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.productVariantsService.update(+id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(13, 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productVariantsService.remove(+id);
  }
}
