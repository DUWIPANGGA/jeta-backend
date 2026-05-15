// src/consultation-materials/consultation-materials.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ConsultationMaterialsService } from './consultation-materials.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('consultation-materials')
@UseGuards(JwtAuthGuard, AccessGuard)
export class ConsultationMaterialsController {
  constructor(private readonly consultationMaterialsService: ConsultationMaterialsService) { }

  @Post()
  @Access(8, 'create')
  create(@Body() createDto: any) {
    return this.consultationMaterialsService.create(createDto);
  }

  @Get()
  @Access(8, 'read')
  findAll() {
    return this.consultationMaterialsService.findAll();
  }

  @Get(':id')
  @Access(8, 'read')
  findOne(@Param('id') id: string) {
    return this.consultationMaterialsService.findOne(+id);
  }

  @Patch(':id')
  @Access(8, 'update')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.consultationMaterialsService.update(+id, updateDto);
  }

  @Delete(':id')
  @Access(8, 'delete')
  remove(@Param('id') id: string) {
    return this.consultationMaterialsService.remove(+id);
  }
}