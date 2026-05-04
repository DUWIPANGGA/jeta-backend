import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TrackingsService } from './trackings.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorator/roles/roles.decorator';
import { Role } from '@prisma/client';
import { Access } from '../common/decorator/access/access.decorator';


@Controller('trackings')
export class TrackingsController {
  constructor(private readonly trackingsService: TrackingsService) { }
  @UseGuards(JwtAuthGuard)
  @Access(22, 'create')
  @Post()
  create(@Body() createDto: any) {
    return this.trackingsService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(22, 'read')
  @Get()
  findAll() {
    return this.trackingsService.findAll();
  }

  @Access(22, 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trackingsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Access(22, 'update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.trackingsService.update(+id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(22, 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trackingsService.remove(+id);
  }
}
