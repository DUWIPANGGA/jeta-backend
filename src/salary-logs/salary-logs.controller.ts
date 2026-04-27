import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SalaryLogsService } from './salary-logs.service';

@Controller('salary-logs')
export class SalaryLogsController {
  constructor(private readonly salaryLogsService: SalaryLogsService) {}

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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.salaryLogsService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.salaryLogsService.remove(+id);
  }
}
