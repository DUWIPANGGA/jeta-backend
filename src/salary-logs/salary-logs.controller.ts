import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SalaryLogsService } from './salary-logs.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/common/decorator/roles/roles.decorator';
import { Role } from '@prisma/client';
@UseGuards(JwtAuthGuard)
@Controller('salary-logs')
export class SalaryLogsController {
  constructor(private readonly salaryLogsService: SalaryLogsService) { }

  @Roles(Role.admin, Role.superadmin)
  @Post()
  create(@Body() createDto: any) {
    return this.salaryLogsService.create(createDto);
  }

  @Get()
  findAll() {
    return this.salaryLogsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salaryLogsService.findOne(+id);
  }

  @Roles(Role.admin, Role.superadmin)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.salaryLogsService.update(+id, updateDto);
  }
  @Roles(Role.admin, Role.superadmin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.salaryLogsService.remove(+id);
  }
}
