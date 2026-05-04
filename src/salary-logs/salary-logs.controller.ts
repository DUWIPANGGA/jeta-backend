import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SalaryLogsService } from './salary-logs.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/common/decorator/roles/roles.decorator';
import { Role } from '@prisma/client';
import { Access } from '../common/decorator/access/access.decorator';

@Controller('salary-logs')
export class SalaryLogsController {
  constructor(private readonly salaryLogsService: SalaryLogsService) { }

  @UseGuards(JwtAuthGuard)
  @Access(18, 'create')
  @Post()
  create(@Body() createDto: any) {
    return this.salaryLogsService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(18, 'read')
  @Get()
  findAll() {
    return this.salaryLogsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Access(18, 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salaryLogsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Access(18, 'update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.salaryLogsService.update(+id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(18, 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.salaryLogsService.remove(+id);
  }
}
