import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/common/decorator/roles/roles.decorator';
import { Role } from '@prisma/client';
import { Access } from '../common/decorator/access/access.decorator';



@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @UseGuards(JwtAuthGuard)
  @Access(4, 'create')
  @Post()
  create(@Body() createDto: any) {
    return this.categoriesService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(4, 'read')
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Access(4, 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Access(4, 'update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.categoriesService.update(+id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(4, 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}
