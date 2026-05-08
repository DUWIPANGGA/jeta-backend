// src/customer-data/customer-data.module.ts
import { Module } from '@nestjs/common';
import { CustomerDataController } from './customer-data.controller';
import { CustomerDataService } from './customer-data.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerDataController],
  providers: [CustomerDataService],
})
export class CustomerDataModule {}