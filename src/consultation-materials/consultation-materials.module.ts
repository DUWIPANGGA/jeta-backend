import { Module } from '@nestjs/common';
import { ConsultationMaterialsService } from './consultation-materials.service';
import { ConsultationMaterialsController } from './consultation-materials.controller';

@Module({
  controllers: [ConsultationMaterialsController],
  providers: [ConsultationMaterialsService],
  exports: [ConsultationMaterialsService],
})
export class ConsultationMaterialsModule {}
