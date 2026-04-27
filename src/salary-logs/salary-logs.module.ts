import { Module } from '@nestjs/common';
import { SalaryLogsService } from './salary-logs.service';
import { SalaryLogsController } from './salary-logs.controller';

@Module({
  controllers: [SalaryLogsController],
  providers: [SalaryLogsService],
  exports: [SalaryLogsService],
})
export class SalaryLogsModule {}
