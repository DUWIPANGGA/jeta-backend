// src/salary-projects/salary-projects.module.ts
import { Module } from '@nestjs/common';
import { SalaryProjectsService } from './salary-projects.service';
import { SalaryProjectsController } from './salary-projects.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SalaryProjectsController],
  providers: [SalaryProjectsService],
  exports: [SalaryProjectsService],
})
export class SalaryProjectsModule { }