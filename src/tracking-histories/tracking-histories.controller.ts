// src/tracking-histories/tracking-histories.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TrackingHistoriesService } from './tracking-histories.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('tracking-histories')
@UseGuards(JwtAuthGuard, AccessGuard)
export class TrackingHistoriesController {
  constructor(private readonly trackingHistoriesService: TrackingHistoriesService) { }

  @Post()
  @Access(30, 'create')
  create(@Body() createDto: any) {
    return this.trackingHistoriesService.create(createDto);
  }

  @Get()
  @Access(30, 'read')
  findAll() {
    return this.trackingHistoriesService.findAll();
  }

  @Get(':id')
  @Access(30, 'read')
  findOne(@Param('id') id: string) {
    return this.trackingHistoriesService.findOne(+id);
  }

  @Patch(':id')
  @Access(30, 'update')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.trackingHistoriesService.update(+id, updateDto);
  }

  @Delete(':id')
  @Access(30, 'delete')
  remove(@Param('id') id: string) {
    return this.trackingHistoriesService.remove(+id);
  }
}