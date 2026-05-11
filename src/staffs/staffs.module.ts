// src/staff/staff.module.ts
import { Module } from '@nestjs/common';
import { StaffService } from './staffs.service';
import { StaffController } from './staffs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffsModule { }