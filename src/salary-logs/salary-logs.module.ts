import { Module } from '@nestjs/common';
import { SalaryLogsService } from './salary-logs.service';
import { SalaryLogsController } from './salary-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],  // ← TAMBAHKAN INI
  controllers: [SalaryLogsController],
  providers: [SalaryLogsService],
  exports: [SalaryLogsService],
})
export class SalaryLogsModule { }