// src/logistics/logistics.controller.ts
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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { CreateLogisticDto } from './dto/create-logistic.dto';
import { UpdateLogisticDto } from './dto/update-logistic.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('logistics')
@UseGuards(JwtAuthGuard, AccessGuard)
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) { }

  @Post()
  @Access('Logistics', 'create')
  create(@Body() createDto: CreateLogisticDto) {
    return this.logisticsService.create(createDto);
  }

  @Get()
  @Access('Logistics', 'read')
  findAll() {
    return this.logisticsService.findAll();
  }

  @Get(':id')
  @Access('Logistics', 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.logisticsService.findOne(id);
  }

  @Patch(':id')
  @Access('Logistics', 'update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateLogisticDto,
  ) {
    return this.logisticsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Access('Logistics', 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.logisticsService.remove(id);
  }
}