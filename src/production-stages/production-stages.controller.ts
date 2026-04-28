import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProductionStagesService } from './production-stages.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/common/decorator/roles/roles.decorator';
import { Role } from '@prisma/client';
@Controller('production-stages')
export class ProductionStagesController {
  constructor(private readonly productionStagesService: ProductionStagesService) { }
  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin, Role.superadmin)
  @Post()
  create(@Body() createDto: any) {
    return this.productionStagesService.create(createDto);
  }

  @Get()
  findAll() {
    return this.productionStagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productionStagesService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin, Role.superadmin)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.productionStagesService.update(+id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin, Role.superadmin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productionStagesService.remove(+id);
  }
}
