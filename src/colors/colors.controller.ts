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
  @Access(35, 'create')
  create(@Body() createDto: CreateColorDto) {
    return this.colorsService.create(createDto);
  }

  @Get()
  @Access(35, 'read')
  findAll() {
    return this.colorsService.findAll();
  }

  @Get(':id')
  @Access(35, 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.colorsService.findOne(id);
  }

  @Patch(':id')
  @Access(35, 'update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateColorDto,
  ) {
    return this.colorsService.update(id, updateDto);
  }

  @Delete(':id')
  @Access(35, 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.colorsService.remove(id);
  }
}