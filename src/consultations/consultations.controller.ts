// src/consultations/consultations.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('consultations')
@UseGuards(JwtAuthGuard, AccessGuard)
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) { }

  @Post()
  @Access(9, 'create')
  create(@Body() createDto: any) {
    return this.consultationsService.create(createDto);
  }

  @Get()
  @Access(9, 'read')
  findAll() {
    return this.consultationsService.findAll();
  }

  @Get(':id')
  @Access(9, 'read')
  findOne(@Param('id') id: string) {
    return this.consultationsService.findOne(+id);
  }

  @Patch(':id')
  @Access(9, 'update')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.consultationsService.update(+id, updateDto);
  }

  @Delete(':id')
  @Access(9, 'delete')
  remove(@Param('id') id: string) {
    return this.consultationsService.remove(+id);
  }
}