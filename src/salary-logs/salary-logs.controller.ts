import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SalaryLogsService } from './salary-logs.service';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { Roles } from '../common/decorator/roles/roles.decorator';
import { Access } from '../common/decorator/access/access.decorator';

@Controller('salary-logs')
@UseGuards(JwtAuthGuard)
export class SalaryLogsController {
  constructor(private readonly salaryLogsService: SalaryLogsService) { }

  @Post()
  @Roles(1, 2)
  @Access(30, 'create')  // page_id = 30 (Rekap Penggajian)
  create(@Body() createDto: any) {
    return this.salaryLogsService.create(createDto);
  }

  @Get()
  @Roles(1, 2, 3)
  @Access(30, 'read')
  findAll() {
    return this.salaryLogsService.findAll();
  }

  @Get(':id')
  @Roles(1, 2, 3)
  @Access(30, 'read')
  findOne(@Param('id') id: string) {
    return this.salaryLogsService.findOne(+id);
  }

  @Get('staff/:staffId')
  @Roles(1, 2, 3)
  @Access(30, 'read')
  findByStaff(@Param('staffId') staffId: string) {
    return this.salaryLogsService.findByUser(+staffId);
  }

  @Patch(':id')
  @Roles(1, 2)
  @Access(30, 'update')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.salaryLogsService.update(+id, updateDto);
  }

  @Delete(':id')
  @Roles(1, 2)
  @Access(30, 'delete')
  remove(@Param('id') id: string) {
    return this.salaryLogsService.remove(+id);
  }
}