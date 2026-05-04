import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProductionStagesService } from './production-stages.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/common/decorator/roles/roles.decorator';
import { Role } from '@prisma/client';
import { Access } from '../common/decorator/access/access.decorator';

@Controller('production-stages')
export class ProductionStagesController {
  constructor(private readonly productionStagesService: ProductionStagesService) { }

  @UseGuards(JwtAuthGuard)
  @Access(15, 'create')
  @Post()
  create(@Body() createDto: any) {
    return this.productionStagesService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(15, 'read')
  @Get()
  findAll() {
    return this.productionStagesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Access(15, 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productionStagesService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Access(15, 'update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.productionStagesService.update(+id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(15, 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productionStagesService.remove(+id);
  }
}
