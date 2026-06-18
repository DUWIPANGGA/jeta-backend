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
import { SizesService } from './sizes.service';
import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';
import { LogActivity } from '../common/decorator/activity-log/activity-log.decorator';

@Controller('sizes')
@UseGuards(JwtAuthGuard, AccessGuard)
export class SizesController {
  constructor(private readonly sizesService: SizesService) {}

  @Post()
  @Access('Sizes', 'create')
  @LogActivity('size', 'create')
  create(@Body() createDto: CreateSizeDto) {
    return this.sizesService.create(createDto);
  }

  @Get()
  @Access('Sizes', 'read')
  findAll() {
    return this.sizesService.findAll();
  }

  @Get(':id')
  @Access('Sizes', 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sizesService.findOne(id);
  }

  @Patch(':id')
  @Access('Sizes', 'update')
  @LogActivity('size', 'update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSizeDto,
  ) {
    return this.sizesService.update(id, updateDto);
  }

  @Delete(':id')
  @Access('Sizes', 'delete')
  @LogActivity('size', 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sizesService.remove(id);
  }
}