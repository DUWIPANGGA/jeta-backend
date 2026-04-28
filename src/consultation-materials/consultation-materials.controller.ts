import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ConsultationMaterialsService } from './consultation-materials.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('consultation-materials')
export class ConsultationMaterialsController {
  constructor(private readonly consultationMaterialsService: ConsultationMaterialsService) { }

  @Post()
  create(@Body() createDto: any) {
    return this.consultationMaterialsService.create(createDto);
  }

  @Get()
  findAll() {
    return this.consultationMaterialsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.consultationMaterialsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.consultationMaterialsService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.consultationMaterialsService.remove(+id);
  }
}
