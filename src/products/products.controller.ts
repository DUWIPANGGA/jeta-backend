import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { storage, fileFilter } from 'src/common/utils/file-upload.utils';

import { ProductsService } from './products.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/common/decorator/roles/roles.decorator';
import { Role } from '@prisma/client';
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }
  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin, Role.superadmin)
  @Post()
  @UseInterceptors(FileInterceptor('image', { storage: storage('products'), fileFilter }))
  create(@Body() createDto: any, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      createDto.image = `/uploads/products/${file.filename}`;
    }
    return this.productsService.create(createDto);
  }


  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }
  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin, Role.superadmin)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', { storage: storage('products'), fileFilter }))
  update(@Param('id') id: string, @Body() updateDto: any, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      updateDto.image = `/uploads/products/${file.filename}`;
    }
    return this.productsService.update(+id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin, Role.superadmin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
