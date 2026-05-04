import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ConsultationMaterialsService } from './consultation-materials.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('consultation-materials')
export class ConsultationMaterialsController {
  constructor(private readonly consultationMaterialsService: ConsultationMaterialsService) { }

  @UseGuards(JwtAuthGuard)
  @Access(6, 'create')
  @Post()
  create(@Body() createDto: any) {
    return this.consultationMaterialsService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(6, 'read')
  @Get()
  findAll() {
    return this.consultationMaterialsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Access(6, 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.consultationMaterialsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Access(6, 'update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.consultationMaterialsService.update(+id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(6, 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.consultationMaterialsService.remove(+id);
  }
}
