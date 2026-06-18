// src/consultations/consultations.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';
import { LogActivity } from 'src/common/decorator/activity-log/activity-log.decorator';

@Controller('consultations')
@UseGuards(JwtAuthGuard, AccessGuard)
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) { }

  @Post()
  @Access('Consultations', 'create')
  @LogActivity('consultation', 'create')
  create(@Body() createDto: any) {
    return this.consultationsService.create(createDto);
  }

  @Get()
  @Access('Consultations', 'read')
  findAll() {
    return this.consultationsService.findAll();
  }

  @Get(':id')
  @Access('Consultations', 'read')
  findOne(@Param('id') id: string) {
    return this.consultationsService.findOne(+id);
  }

  @Patch(':id')
  @Access('Consultations', 'update')
  @LogActivity('consultation', 'update')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.consultationsService.update(+id, updateDto);
  }

  @Delete(':id')
  @Access('Consultations', 'delete')
  @LogActivity('consultation', 'delete')
  remove(@Param('id') id: string) {
    return this.consultationsService.remove(+id);
  }
}