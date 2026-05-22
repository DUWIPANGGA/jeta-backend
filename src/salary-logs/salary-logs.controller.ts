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
  @Access('SalaryLogs', 'create')
  create(@Body() createDto: any) {
    return this.salaryLogsService.create(createDto);
  }

  @Get()
  @Access('SalaryLogs', 'read')
  findAll() {
    return this.salaryLogsService.findAll();
  }

  @Get(':id')
  @Access('SalaryLogs', 'read')
  findOne(@Param('id') id: string) {
    return this.salaryLogsService.findOne(+id);
  }

  @Get('staff/:staffId')
  @Access('SalaryLogs', 'read')
  findByStaff(@Param('staffId') staffId: string) {
    return this.salaryLogsService.findByUser(+staffId);
  }

  @Patch(':id')
  @Access('SalaryLogs', 'update')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.salaryLogsService.update(+id, updateDto);
  }

  @Delete(':id')
  @Access('SalaryLogs', 'delete')
  remove(@Param('id') id: string) {
    return this.salaryLogsService.remove(+id);
  }
}