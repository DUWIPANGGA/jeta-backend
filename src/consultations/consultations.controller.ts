import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) { }

  @UseGuards(JwtAuthGuard)
  @Access(7, 'create')
  @Post()
  create(@Body() createDto: any) {
    return this.consultationsService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(7, 'read')
  @Get()
  findAll() {
    return this.consultationsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Access(7, 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.consultationsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Access(7, 'update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.consultationsService.update(+id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(7, 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.consultationsService.remove(+id);
  }
}
