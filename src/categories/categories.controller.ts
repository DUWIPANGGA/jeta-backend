// src/categories/categories.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
@UseGuards(JwtAuthGuard, AccessGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Get()
  @Access(3, 'read')
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @Access(3, 'read')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @Post()
  @Access(3, 'create')
  create(@Body() createDto: CreateCategoryDto) {
    return this.categoriesService.create(createDto);
  }

  @Patch(':id')
  @Access(3, 'update')
  update(@Param('id') id: string, @Body() updateDto: UpdateCategoryDto) {
    return this.categoriesService.update(+id, updateDto);
  }

  @Delete(':id')
  @Access(3, 'delete')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}