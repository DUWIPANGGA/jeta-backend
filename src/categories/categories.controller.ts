import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/common/decorator/roles/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post()
  @Roles(Role.admin, Role.superadmin)
  create(@Body() createDto: any) {
    return this.categoriesService.create(createDto);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.admin, Role.superadmin)
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.categoriesService.update(+id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.admin, Role.superadmin)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}
