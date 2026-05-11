// src/salary-projects/salary-projects.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { SalaryProjectsService } from './salary-projects.service';
import { CreateSalaryProjectDto } from './dto/create-salary-project.dto';
import { UpdateSalaryProjectDto } from './dto/update-salary-project.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('salary-projects')
export class SalaryProjectsController {
  constructor(private readonly service: SalaryProjectsService) { }

  @Post()
  create(@Body() dto: CreateSalaryProjectDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSalaryProjectDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}