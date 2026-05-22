// src/pages/pages.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('pages')
@UseGuards(JwtAuthGuard, AccessGuard)
export class PagesController {
  constructor(private readonly pagesService: PagesService) { }

  @Post()
  @Access('Pages', 'create')
  create(@Body() createPageDto: CreatePageDto) {
    return this.pagesService.create(createPageDto);
  }

  @Get()
  @Access('Pages', 'read')
  findAll() {
    return this.pagesService.findAll();
  }

  @Get(':id')
  @Access('Pages', 'read')
  findOne(@Param('id') id: string) {
    return this.pagesService.findOne(+id);
  }

  @Patch(':id')
  @Access('Pages', 'update')
  update(@Param('id') id: string, @Body() updatePageDto: UpdatePageDto) {
    return this.pagesService.update(+id, updatePageDto);
  }

  @Delete(':id')
  @Access('Pages', 'delete')
  remove(@Param('id') id: string) {
    return this.pagesService.remove(+id);
  }
}