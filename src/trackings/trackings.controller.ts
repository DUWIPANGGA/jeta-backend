// src/trackings/trackings.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TrackingsService } from './trackings.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('trackings')
@UseGuards(JwtAuthGuard, AccessGuard)
export class TrackingsController {
  constructor(private readonly trackingsService: TrackingsService) { }

  @Post()
  @Access(31, 'create')
  create(@Body() createDto: any) {
    return this.trackingsService.create(createDto);
  }

  @Get()
  @Access(31, 'read')
  findAll() {
    return this.trackingsService.findAll();
  }

  @Get(':id')
  @Access(31, 'read')
  findOne(@Param('id') id: string) {
    return this.trackingsService.findOne(+id);
  }

  @Patch(':id')
  @Access(31, 'update')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.trackingsService.update(+id, updateDto);
  }

  @Delete(':id')
  @Access(31, 'delete')
  remove(@Param('id') id: string) {
    return this.trackingsService.remove(+id);
  }
}