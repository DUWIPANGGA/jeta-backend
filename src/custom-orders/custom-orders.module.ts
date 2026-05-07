import { Module } from '@nestjs/common';
import { CustomOrdersService } from './custom-orders.service';
import { CustomOrdersController } from './custom-orders.controller';
import { PrismaModule } from '../prisma/prisma.module'; // <-- import

@Module({
  imports: [PrismaModule], // <-- tambahkan
  controllers: [CustomOrdersController],
  providers: [CustomOrdersService],
  exports: [CustomOrdersService],
})
export class CustomOrdersModule { }