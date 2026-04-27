import { Module } from '@nestjs/common';
import { ProductionLogsService } from './production-logs.service';
import { ProductionLogsController } from './production-logs.controller';

@Module({
  controllers: [ProductionLogsController],
  providers: [ProductionLogsService],
  exports: [ProductionLogsService],
})
export class ProductionLogsModule {}
