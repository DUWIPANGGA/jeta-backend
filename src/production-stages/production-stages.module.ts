import { Module } from '@nestjs/common';
import { ProductionStagesService } from './production-stages.service';
import { ProductionStagesController } from './production-stages.controller';

@Module({
  controllers: [ProductionStagesController],
  providers: [ProductionStagesService],
  exports: [ProductionStagesService],
})
export class ProductionStagesModule {}
