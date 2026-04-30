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

@Controller('portofolio')
export class PortofolioController {
  constructor(private readonly portofolioService: PortofolioService) {}

  // CREATE - POST /portofolio
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPortofolioDto: CreatePortofolioDto) {
    return this.portofolioService.create(createPortofolioDto);
  }

  // READ ALL - GET /portofolio
  @Get()
  findAll() {
    return this.portofolioService.findAll();
  }

  // READ ONE - GET /portofolio/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.portofolioService.findOne(+id);
  }

  // SEARCH - GET /portofolio/search?keyword=xxx
  @Get('search')
  search(@Query('keyword') keyword: string) {
    return this.portofolioService.search(keyword);
  }

  // UPDATE - PATCH /portofolio/:id
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePortofolioDto: UpdatePortofolioDto) {
    return this.portofolioService.update(+id, updatePortofolioDto);
  }

  // DELETE - DELETE /portofolio/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.portofolioService.remove(+id);
  }
}