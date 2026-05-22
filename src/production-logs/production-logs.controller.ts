// src/production-logs/production-logs.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProductionLogsService } from './production-logs.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('production-logs')
@UseGuards(JwtAuthGuard, AccessGuard)
export class ProductionLogsController {
  constructor(private readonly productionLogsService: ProductionLogsService) { }

  @Post()
  @Access('ProductionLogs', 'create')
  create(@Body() createDto: any) {
    return this.productionLogsService.create(createDto);
  }

  @Get()
  @Access('ProductionLogs', 'read')
  findAll() {
    return this.productionLogsService.findAll();
  }

  @Get(':id')
  @Access('ProductionLogs', 'read')
  findOne(@Param('id') id: string) {
    return this.productionLogsService.findOne(+id);
  }

  @Patch(':id')
  @Access('ProductionLogs', 'update')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.productionLogsService.update(+id, updateDto);
  }

  @Delete(':id')
  @Access('ProductionLogs', 'delete')
  remove(@Param('id') id: string) {
    return this.productionLogsService.remove(+id);
  }
}