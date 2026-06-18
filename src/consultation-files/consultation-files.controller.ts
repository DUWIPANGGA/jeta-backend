// src/consultation-files/consultation-files.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { storage, fileFilter } from 'src/common/utils/file-upload.utils';
import { ConsultationFilesService } from './consultation-files.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';
import { LogActivity } from 'src/common/decorator/activity-log/activity-log.decorator';

@Controller('consultation-files')
@UseGuards(JwtAuthGuard, AccessGuard)
export class ConsultationFilesController {
  constructor(private readonly consultationFilesService: ConsultationFilesService) { }

  @Post()
  @Access('ConsultationFiles', 'create')
  @LogActivity('consultationFile', 'create')
  @UseInterceptors(FileInterceptor('file', { storage: storage('consultations'), fileFilter }))
  create(@Body() createDto: any, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      createDto.file_path = `/uploads/consultations/${file.filename}`;
      createDto.file_name = file.originalname;
    }
    return this.consultationFilesService.create(createDto);
  }

  @Get()
  @Access('ConsultationFiles', 'read')
  findAll() {
    return this.consultationFilesService.findAll();
  }

  @Get(':id')
  @Access('ConsultationFiles', 'read')
  findOne(@Param('id') id: string) {
    return this.consultationFilesService.findOne(+id);
  }

  @Patch(':id')
  @Access('ConsultationFiles', 'update')
  @LogActivity('consultationFile', 'update')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.consultationFilesService.update(+id, updateDto);
  }

  @Delete(':id')
  @Access('ConsultationFiles', 'delete')
  @LogActivity('consultationFile', 'delete')
  remove(@Param('id') id: string) {
    return this.consultationFilesService.remove(+id);
  }
}