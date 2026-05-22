// src/stages/stages.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StagesService } from './stages.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';

@Controller('stages')
@UseGuards(JwtAuthGuard, AccessGuard)
export class StagesController {
  constructor(private readonly stagesService: StagesService) { }

  @Post()
  @Access('Stages', 'create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createStageDto: CreateStageDto) {
    return this.stagesService.create(createStageDto);
  }

  @Get()
  @Access('Stages', 'read')
  findAll() {
    return this.stagesService.findAll();
  }

  @Get(':id')
  @Access('Stages', 'read')
  findOne(@Param('id') id: string) {
    return this.stagesService.findOne(+id);
  }

  @Patch(':id')
  @Access('Stages', 'update')
  update(@Param('id') id: string, @Body() updateStageDto: UpdateStageDto) {
    return this.stagesService.update(+id, updateStageDto);
  }

  @Patch(':id/order')
  @Access('Stages', 'update')
  updateOrder(
    @Param('id') id: string,
    @Body('order') order: number,
  ) {
    return this.stagesService.updateOrder(+id, order);
  }

  @Delete(':id')
  @Access('Stages', 'delete')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.stagesService.remove(+id);
  }
}