import { Module } from '@nestjs/common';
import { ProgressReportsService } from './progress-reports.service';
import { ProgressReportsController } from './progress-reports.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProgressReportsController],
  providers: [ProgressReportsService],
})
export class ProgressReportsModule {}