import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { storage, fileFilter } from 'src/common/utils/file-upload.utils';

import { ConsultationFilesService } from './consultation-files.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('consultation-files')
export class ConsultationFilesController {
  constructor(private readonly consultationFilesService: ConsultationFilesService) { }

  @UseGuards(JwtAuthGuard)
  @Access(5, 'create')
  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: storage('consultations'), fileFilter }))
  create(@Body() createDto: any, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      createDto.file_path = `/uploads/consultations/${file.filename}`;
      createDto.file_name = file.originalname;
    }
    return this.consultationFilesService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(5, 'read')
  @Get()
  findAll() {
    return this.consultationFilesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Access(5, 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.consultationFilesService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Access(5, 'update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.consultationFilesService.update(+id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(5, 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.consultationFilesService.remove(+id);
  }
}
