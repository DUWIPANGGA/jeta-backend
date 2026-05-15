// src/salary-logs/salary-logs.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SalaryLogsService } from './salary-logs.service';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';

@Controller('salary-logs')
@UseGuards(JwtAuthGuard, AccessGuard)
export class SalaryLogsController {
  constructor(private readonly salaryLogsService: SalaryLogsService) { }

  @Post()
  @Access(26, 'create')
  create(@Body() createDto: any) {
    return this.salaryLogsService.create(createDto);
  }

  @Get()
  @Access(26, 'read')
  findAll() {
    return this.salaryLogsService.findAll();
  }

  @Get(':id')
  @Access(26, 'read')
  findOne(@Param('id') id: string) {
    return this.salaryLogsService.findOne(+id);
  }

  @Get('staff/:staffId')
  @Access(26, 'read')
  findByStaff(@Param('staffId') staffId: string) {
    return this.salaryLogsService.findByUser(+staffId);
  }

  @Patch(':id')
  @Access(26, 'update')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.salaryLogsService.update(+id, updateDto);
  }

  @Delete(':id')
  @Access(26, 'delete')
  remove(@Param('id') id: string) {
    return this.salaryLogsService.remove(+id);
  }
}