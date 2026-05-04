import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StagesService } from './stages.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorator/roles/roles.decorator';
import { Role } from '@prisma/client';

@Controller('stages')
export class StagesController {
  constructor(private readonly stagesService: StagesService) { }
  @UseGuards(JwtAuthGuard)
  @Roles(1, 2)
  @Post()
  create(@Body() createDto: any) {
    return this.stagesService.create(createDto);
  }
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.stagesService.findAll();
  }
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stagesService.findOne(+id);
  }
  @UseGuards(JwtAuthGuard)
  @Roles(1, 2)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.stagesService.update(+id, updateDto);
  }
  @UseGuards(JwtAuthGuard)
  @Roles(1, 2)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stagesService.remove(+id);
  }
}
