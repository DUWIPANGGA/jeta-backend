import { Module } from '@nestjs/common';
import { ConsultationFilesService } from './consultation-files.service';
import { ConsultationFilesController } from './consultation-files.controller';

@Module({
  controllers: [ConsultationFilesController],
  providers: [ConsultationFilesService],
  exports: [ConsultationFilesService],
})
export class ConsultationFilesModule {}
