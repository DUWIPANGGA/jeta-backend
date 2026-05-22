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
import { ColorsService } from './colors.service';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';

@Controller('colors')
@UseGuards(JwtAuthGuard, AccessGuard)
export class ColorsController {
  constructor(private readonly colorsService: ColorsService) {}

  @Post()
  @Access('Colors', 'create')
  create(@Body() createDto: CreateColorDto) {
    return this.colorsService.create(createDto);
  }

  @Get()
  @Access('Colors', 'read')
  findAll() {
    return this.colorsService.findAll();
  }

  @Get(':id')
  @Access('Colors', 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.colorsService.findOne(id);
  }

  @Patch(':id')
  @Access('Colors', 'update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateColorDto,
  ) {
    return this.colorsService.update(id, updateDto);
  }

  @Delete(':id')
  @Access('Colors', 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.colorsService.remove(id);
  }
}