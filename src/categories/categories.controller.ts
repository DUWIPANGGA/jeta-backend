// categories.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  // @UseGuards(JwtAuthGuard, AccessGuard)
  // @Access(4, 'read')
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  // @UseGuards(JwtAuthGuard, AccessGuard)
  // @Access(4, 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, AccessGuard)
  // @Access(4, 'create')
  @Post()
  create(@Body() createDto: CreateCategoryDto) { // ganti any
    return this.categoriesService.create(createDto);
  }

  @UseGuards(JwtAuthGuard, AccessGuard)
  // @Access(4, 'update')
  @Patch(':id')
  update(@Param('id') id  : string, @Body() updateDto: UpdateCategoryDto) { // ganti any
    return this.categoriesService.update(+id, updateDto);
  }

  @UseGuards(JwtAuthGuard, AccessGuard)
  // @Access(4, 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}