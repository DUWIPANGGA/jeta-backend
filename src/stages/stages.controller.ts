import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StagesService } from './stages.service';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorator/roles/roles.decorator';
import { Role } from '@prisma/client';
import { Access } from '../common/decorator/access/access.decorator';

@Controller('stages')
export class StagesController {
  constructor(private readonly stagesService: StagesService) { }
  @UseGuards(JwtAuthGuard)
  @Access(20, 'create')
  @Post()
  create(@Body() createDto: any) {
    return this.stagesService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(20, 'read')
  @Get()
  findAll() {
    return this.stagesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Access(20, 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stagesService.findOne(+id);
  }
  @UseGuards(JwtAuthGuard)
  @Access(22, 'update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.stagesService.update(+id, updateDto);
  }
  @UseGuards(JwtAuthGuard)
  @Access(22, 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stagesService.remove(+id);
  }
}
