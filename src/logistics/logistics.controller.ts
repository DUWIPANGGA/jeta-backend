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
import { Access } from 'src/common/decorator/access/access.decorator';

@UseGuards(JwtAuthGuard)
@Controller('logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Post()
  @Access(11, 'create') // Gunakan page_id baru (misal: 11) untuk modul Logistics
  create(@Body() createDto: CreateLogisticDto) {
    return this.logisticsService.create(createDto);
  }

  @Get()
  @Access(11, 'read')
  findAll() {
    return this.logisticsService.findAll();
  }

  @Get(':id')
  @Access(11, 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.logisticsService.findOne(id);
  }

  @Patch(':id')
  @Access(11, 'update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateLogisticDto,
  ) {
    return this.logisticsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Access(11, 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.logisticsService.remove(id);
  }
}