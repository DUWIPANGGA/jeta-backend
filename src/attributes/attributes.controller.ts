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
import { AttributesService } from './attributes.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';
import { LogActivity } from '../common/decorator/activity-log/activity-log.decorator';

@Controller('attributes')
@UseGuards(JwtAuthGuard, AccessGuard)
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Post()
  @Access('Attributes', 'create')
  @LogActivity('attribute', 'create')
  create(@Body() createDto: CreateAttributeDto) {
    return this.attributesService.create(createDto);
  }

  @Get()
  @Access('Attributes', 'read')
  findAll() {
    return this.attributesService.findAll();
  }

  @Get(':id')
  @Access('Attributes', 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.attributesService.findOne(id);
  }

  @Patch(':id')
  @Access('Attributes', 'update')
  @LogActivity('attribute', 'update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAttributeDto,
  ) {
    return this.attributesService.update(id, updateDto);
  }

  @Delete(':id')
  @Access('Attributes', 'delete')
  @LogActivity('attribute', 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.attributesService.remove(id);
  }
}