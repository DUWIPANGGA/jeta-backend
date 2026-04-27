import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ConsultationFilesService } from './consultation-files.service';

@Controller('consultation-files')
export class ConsultationFilesController {
  constructor(private readonly consultationFilesService: ConsultationFilesService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.consultationFilesService.create(createDto);
  }

  @Get()
  findAll() {
    return this.consultationFilesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.consultationFilesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.consultationFilesService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.consultationFilesService.remove(+id);
  }
}
