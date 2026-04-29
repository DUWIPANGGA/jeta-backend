import { Module } from '@nestjs/common';
import { ProductionLogsService } from './production-logs.service';
import { ProductionLogsController } from './production-logs.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProductionLogsController],
  providers: [ProductionLogsService],
  exports: [ProductionLogsService],
})
export class ProductionLogsModule {}