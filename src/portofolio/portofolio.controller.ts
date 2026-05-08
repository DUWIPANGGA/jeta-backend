import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PortofolioService } from './portofolio.service';
import { CreatePortofolioDto } from './dto/create-portofolio.dto';
import { UpdatePortofolioDto } from './dto/update-portofolio.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@UseGuards(JwtAuthGuard)
@Controller('portofolios')
export class PortofolioController {
  constructor(private readonly portofolioService: PortofolioService) {}

  @Post()
  @Access(12, 'create')
  create(@Body() dto: CreatePortofolioDto) {
    return this.portofolioService.create(dto);
  }

  @Get()
  @Access(12, 'read')
  findAll() {
    return this.portofolioService.findAll();
  }

  @Get(':id')
  @Access(12, 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.portofolioService.findOne(id);
  }

  @Patch(':id')
  @Access(12, 'update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePortofolioDto) {
    return this.portofolioService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Access(12, 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.portofolioService.remove(id);
  }
}