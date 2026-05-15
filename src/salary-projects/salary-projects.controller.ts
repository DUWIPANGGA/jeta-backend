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
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';

@Controller('salary-projects')
@UseGuards(JwtAuthGuard, AccessGuard)
export class SalaryProjectsController {
  constructor(private readonly service: SalaryProjectsService) { }

  @Post()
  @Access(27, 'create')
  create(@Body() dto: CreateSalaryProjectDto) {
    return this.service.create(dto);
  }

  @Get()
  @Access(27, 'read')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Access(27, 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Access(27, 'update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSalaryProjectDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Access(27, 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}