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

@Controller('sizes')
@UseGuards(JwtAuthGuard, AccessGuard)
export class SizesController {
  constructor(private readonly sizesService: SizesService) {}

  @Post()
  @Access(34, 'create')
  create(@Body() createDto: CreateSizeDto) {
    return this.sizesService.create(createDto);
  }

  @Get()
  @Access(34, 'read')
  findAll() {
    return this.sizesService.findAll();
  }

  @Get(':id')
  @Access(34, 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sizesService.findOne(id);
  }

  @Patch(':id')
  @Access(34, 'update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSizeDto,
  ) {
    return this.sizesService.update(id, updateDto);
  }

  @Delete(':id')
  @Access(34, 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sizesService.remove(id);
  }
}