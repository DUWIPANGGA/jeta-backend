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
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';
import { LogActivity } from '../common/decorator/activity-log/activity-log.decorator';

@Controller('materials')
@UseGuards(JwtAuthGuard, AccessGuard)
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @Access('Materials', 'create')
  @LogActivity('material', 'create')
  create(@Body() createDto: CreateMaterialDto) {
    return this.materialsService.create(createDto);
  }

  @Get()
  @Access('Materials', 'read')
  findAll() {
    return this.materialsService.findAll();
  }

  @Get(':id')
  @Access('Materials', 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.materialsService.findOne(id);
  }

  @Patch(':id')
  @Access('Materials', 'update')
  @LogActivity('material', 'update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMaterialDto,
  ) {
    return this.materialsService.update(id, updateDto);
  }

  @Delete(':id')
  @Access('Materials', 'delete')
  @LogActivity('material', 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.materialsService.remove(id);
  }
}