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
  Query,
  UseGuards,
} from '@nestjs/common';
import { PortofolioService } from './portofolio.service';
import { CreatePortofolioDto } from './dto/create-portofolio.dto';
import { UpdatePortofolioDto } from './dto/update-portofolio.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('portofolio')
export class PortofolioController {
  constructor(private readonly portofolioService: PortofolioService) { }

  // CREATE - POST /portofolio
  @Post()
  @UseGuards(JwtAuthGuard)
  @Access(12, 'create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPortofolioDto: CreatePortofolioDto) {
    return this.portofolioService.create(createPortofolioDto);
  }

  // READ ALL - GET /portofolio
  @UseGuards(JwtAuthGuard)
  @Access(12, 'read')
  @Get()
  findAll() {
    return this.portofolioService.findAll();
  }

  // READ ONE - GET /portofolio/:id
  @UseGuards(JwtAuthGuard)
  @Access(12, 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.portofolioService.findOne(+id);
  }

  // SEARCH - GET /portofolio/search?keyword=xxx
  @UseGuards(JwtAuthGuard)
  @Access(12, 'read')
  @Get('search')
  search(@Query('keyword') keyword: string) {
    return this.portofolioService.search(keyword);
  }

  // UPDATE - PATCH /portofolio/:id
  @UseGuards(JwtAuthGuard)
  @Access(12, 'update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePortofolioDto: UpdatePortofolioDto) {
    return this.portofolioService.update(+id, updatePortofolioDto);
  }

  // DELETE - DELETE /portofolio/:id
  @UseGuards(JwtAuthGuard)
  @Access(12, 'delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.portofolioService.remove(+id);
  }
}