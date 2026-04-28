import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategorysService } from './categorys.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/common/decorator/roles/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('categorys')
export class CategorysController {
  constructor(private readonly categorysService: CategorysService) { }

  @Post()
  @Roles(Role.admin, Role.superadmin)
  create(@Body() createDto: any) {
    return this.categorysService.create(createDto);
  }

  @Get()
  findAll() {
    return this.categorysService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categorysService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.admin, Role.superadmin)
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.categorysService.update(+id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.admin, Role.superadmin)
  remove(@Param('id') id: string) {
    return this.categorysService.remove(+id);
  }
}
