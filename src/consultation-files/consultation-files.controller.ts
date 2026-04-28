import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { storage, fileFilter } from 'src/common/utils/file-upload.utils';

import { ConsultationFilesService } from './consultation-files.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('consultation-files')
export class ConsultationFilesController {
  constructor(private readonly consultationFilesService: ConsultationFilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: storage('consultations'), fileFilter }))
  create(@Body() createDto: any, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      createDto.file_path = `/uploads/consultations/${file.filename}`;
      createDto.file_name = file.originalname;
    }
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
