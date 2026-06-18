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
  DefaultValuePipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';
import { LogActivity } from '../common/decorator/activity-log/activity-log.decorator';

@Controller('categories')
@UseGuards(JwtAuthGuard, AccessGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Access('Categories', 'read')
  async findAll(@Query('include_inactive') includeInactive?: string) {
    const includeInactiveBool = includeInactive === 'true';
    return this.categoriesService.findAll(includeInactiveBool);
  }

  @Get(':id')
  @Access('Categories', 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @Access('Categories', 'create')
  @LogActivity('category', 'create')
  create(@Body() createDto: CreateCategoryDto) {
    return this.categoriesService.create(createDto);
  }

  @Patch(':id')
  @Access('Categories', 'update')
  @LogActivity('category', 'update')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateDto);
  }

  @Delete(':id')
  @Access('Categories', 'delete')
  @LogActivity('category', 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}