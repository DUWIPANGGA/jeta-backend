// src/sub-categories/sub-categories.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SubCategoriesService } from './sub-categories.service';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';

@Controller('sub-categories')
@UseGuards(JwtAuthGuard, AccessGuard)
export class SubCategoriesController {
  constructor(private readonly service: SubCategoriesService) { }

  @Post()
  @Access(4, 'create')
  create(@Body() createDto: CreateSubCategoryDto) {
    return this.service.create(createDto);
  }

  @Get()
  @Access(4, 'read')
  findAll() {
    return this.service.findAll();
  }

  @Get('by-category/:categoryId')
  @Access(4, 'read')
  findByCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.service.findByCategory(categoryId);
  }

  @Get(':id')
  @Access(4, 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Access(4, 'update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSubCategoryDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @Access(4, 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}